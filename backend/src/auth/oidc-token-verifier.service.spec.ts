import { UnauthorizedException } from '@nestjs/common';
import type { JWTVerifyGetKey } from 'jose';
import { OidcTokenVerifier } from './oidc-token-verifier.service';
import type { OidcOptions } from './auth.types';

const options: OidcOptions = {
  issuer: 'https://issuer.test/',
  audience: 'https://api.test',
  jwksUri: 'https://issuer.test/.well-known/jwks.json',
};

interface SigningContext {
  privateKey: CryptoKey;
  keyResolver: JWTVerifyGetKey;
  kid: string;
}

async function createSigningContext(kid = 'test-key'): Promise<SigningContext> {
  const { createLocalJWKSet, exportJWK, generateKeyPair } =
    await import('jose');
  const { privateKey, publicKey } = await generateKeyPair('RS256');
  const publicJwk = await exportJWK(publicKey);

  return {
    privateKey,
    keyResolver: createLocalJWKSet({
      keys: [{ ...publicJwk, alg: 'RS256', kid, use: 'sig' }],
    }),
    kid,
  };
}

async function signToken(
  signingContext: SigningContext,
  overrides: {
    issuer?: string;
    audience?: string | string[];
    subject?: string | null;
    expirationTime?: string | number;
    notBefore?: string | number;
  } = {},
): Promise<string> {
  const { SignJWT } = await import('jose');
  let token = new SignJWT({})
    .setProtectedHeader({ alg: 'RS256', kid: signingContext.kid })
    .setIssuer(overrides.issuer ?? options.issuer)
    .setAudience(overrides.audience ?? options.audience)
    .setIssuedAt()
    .setExpirationTime(overrides.expirationTime ?? '5m');

  if (overrides.subject !== null) {
    token = token.setSubject(overrides.subject ?? 'user-123');
  }

  if (overrides.notBefore !== undefined) {
    token = token.setNotBefore(overrides.notBefore);
  }

  return token.sign(signingContext.privateKey);
}

describe('OidcTokenVerifier', () => {
  let signingContext: SigningContext;
  let verifier: OidcTokenVerifier;

  beforeAll(async () => {
    signingContext = await createSigningContext();
    verifier = new OidcTokenVerifier(options, signingContext.keyResolver);
  });

  it('returns identity only after validating a signed API access token', async () => {
    const accessToken = await signToken(signingContext);

    await expect(verifier.verify(accessToken)).resolves.toEqual({
      issuer: options.issuer,
      subject: 'user-123',
    });
  });

  it('accepts an audience array containing the API audience', async () => {
    const accessToken = await signToken(signingContext, {
      audience: [options.audience, 'https://issuer.test/userinfo'],
    });

    await expect(verifier.verify(accessToken)).resolves.toEqual({
      issuer: options.issuer,
      subject: 'user-123',
    });
  });

  it.each([
    ['wrong issuer', { issuer: 'https://wrong-issuer.test/' }],
    ['wrong audience', { audience: 'https://wrong-api.test' }],
    ['an ID token audience', { audience: 'frontend-client-id' }],
    ['an expired token', { expirationTime: 0 }],
    ['a token that is not valid yet', { notBefore: '5m' }],
    ['a missing subject', { subject: null }],
  ] as const)('rejects %s', async (_caseName, overrides) => {
    const token = await signToken(signingContext, overrides);

    await expect(verifier.verify(token)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects a token with an invalid signature', async () => {
    const untrustedSigningContext = await createSigningContext();
    const token = await signToken(untrustedSigningContext);

    await expect(verifier.verify(token)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects a token signed with an unknown key id', async () => {
    const unknownSigningContext = await createSigningContext('unknown-key');
    const token = await signToken(unknownSigningContext);

    await expect(verifier.verify(token)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects a token signed with a disallowed algorithm', async () => {
    const { SignJWT } = await import('jose');
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256', kid: signingContext.kid })
      .setIssuer(options.issuer)
      .setAudience(options.audience)
      .setSubject('user-123')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(new TextEncoder().encode('untrusted-shared-secret'));

    await expect(verifier.verify(token)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects a malformed token without exposing parsing details', async () => {
    await expect(verifier.verify('not-a-jwt')).rejects.toMatchObject({
      message: 'Invalid access token',
    });
  });
});
