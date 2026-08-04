import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { configureApp } from '../src/app.config';
import { AppModule } from '../src/app.module';
import { OidcTokenVerifier } from '../src/auth/oidc-token-verifier.service';

const id = '00000000-0000-4000-8000-000000000001';

describe('API hardening (e2e)', () => {
  let app: INestApplication<App>;
  const verify = jest.fn(() =>
    Promise.reject(new UnauthorizedException('Invalid access token')),
  );

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(OidcTokenVerifier)
      .useValue({ verify })
      .compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => app.close());

  it.each([
    ['get', '/'],
    ['get', '/me'],
    ['get', '/collections'],
    ['post', '/collections'],
    ['get', `/collections/${id}`],
    ['put', `/collections/${id}`],
    ['patch', `/collections/${id}`],
    ['delete', `/collections/${id}`],
    ['get', '/bookmarks'],
    ['post', '/bookmarks'],
    ['get', `/bookmarks/${id}`],
    ['put', `/bookmarks/${id}`],
    ['patch', `/bookmarks/${id}`],
    ['delete', `/bookmarks/${id}`],
    ['get', `/collections/${id}/bookmarks`],
  ] as const)(
    'protects %s %s without route-specific exceptions',
    async (method, path) => {
      const response = await request(app.getHttpServer())
        [method](path)
        .expect(401);

      expect(response.body).toEqual({
        statusCode: 401,
        code: 'UNAUTHENTICATED',
        message: 'Bearer token required',
      });
    },
  );

  it('does not echo rejected bearer tokens or verifier details', async () => {
    const secretToken = 'sensitive-token-that-must-not-appear';
    const response = await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', `Bearer ${secretToken}`)
      .expect(401);
    const serializedBody = JSON.stringify(response.body);

    expect(response.body).toEqual({
      statusCode: 401,
      code: 'INVALID_TOKEN',
      message: 'Invalid access token',
    });
    expect(serializedBody).not.toContain(secretToken);
  });

  it('allows browser preflight only for the configured frontend origin', async () => {
    const allowed = await request(app.getHttpServer())
      .options('/me')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'authorization')
      .expect(204);

    expect(allowed.headers['access-control-allow-origin']).toBe(
      'http://localhost:5173',
    );

    const rejected = await request(app.getHttpServer())
      .options('/me')
      .set('Origin', 'https://untrusted.example')
      .set('Access-Control-Request-Method', 'GET')
      .expect(404);

    expect(rejected.headers).not.toHaveProperty('access-control-allow-origin');
  });
});
