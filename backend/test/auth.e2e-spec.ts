import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { OidcTokenVerifier } from '../src/auth/oidc-token-verifier.service';
import type { VerifiedIdentity } from '../src/auth/auth.types';
import { PrismaService } from '../src/database/prisma.service';

const identities: Record<string, VerifiedIdentity> = {
  'token-user-a': {
    issuer: 'https://auth-e2e.local/',
    subject: 'user-a',
  },
  'token-user-b': {
    issuer: 'https://auth-e2e.local/',
    subject: 'user-b',
  },
  'token-user-a-other-issuer': {
    issuer: 'https://other-auth-e2e.local/',
    subject: 'user-a',
  },
};

describe('authentication and /me (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const verify = jest.fn((token: string): Promise<VerifiedIdentity> => {
    const identity = identities[token];

    if (!identity) {
      return Promise.reject(new UnauthorizedException('Invalid access token'));
    }

    return Promise.resolve(identity);
  });

  async function cleanAuthTestUsers(): Promise<void> {
    await prisma.user.deleteMany({
      where: {
        externalIssuer: {
          in: ['https://auth-e2e.local/', 'https://other-auth-e2e.local/'],
        },
      },
    });
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(OidcTokenVerifier)
      .useValue({ verify })
      .compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get(PrismaService);
    await app.init();
  });

  beforeEach(async () => {
    verify.mockClear();
    await cleanAuthTestUsers();
  });

  afterAll(async () => {
    await cleanAuthTestUsers();
    await app.close();
  });

  it('rejects a request without a bearer credential before token verification', async () => {
    await request(app.getHttpServer()).get('/me').expect(401);

    expect(verify).not.toHaveBeenCalled();
  });

  it('rejects a malformed authorization scheme before token verification', async () => {
    await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', 'Basic credentials')
      .expect(401);

    expect(verify).not.toHaveBeenCalled();
  });

  it('returns 401 when the token-verification boundary rejects a bearer token', async () => {
    await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);

    expect(verify).toHaveBeenCalledWith('invalid-token');
  });

  it('atomically provisions and reuses the same persisted user', async () => {
    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        request(app.getHttpServer())
          .get('/me')
          .set('Authorization', 'Bearer token-user-a')
          .expect(200),
      ),
    );

    const responseBodies = responses.map(
      (response) =>
        response.body as { id: string; email: null; displayName: null },
    );
    const userIds = new Set(responseBodies.map((body) => body.id));
    expect(userIds.size).toBe(1);
    expect(responseBodies[0]).toMatchObject({
      email: null,
      displayName: null,
    });
    expect(responseBodies[0]).not.toHaveProperty('externalIssuer');
    expect(responseBodies[0]).not.toHaveProperty('externalSubject');

    await expect(
      prisma.user.count({
        where: {
          externalIssuer: 'https://auth-e2e.local/',
          externalSubject: 'user-a',
        },
      }),
    ).resolves.toBe(1);
  });

  it('treats the same subject from a different issuer as a different user', async () => {
    const first = await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', 'Bearer token-user-a')
      .expect(200);
    const second = await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', 'Bearer token-user-a-other-issuer')
      .expect(200);

    const firstUser = first.body as { id: string };
    const secondUser = second.body as { id: string };

    expect(firstUser.id).not.toBe(secondUser.id);
  });
});
