import {
  Inject,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import type { JWTVerifyGetKey } from 'jose';
import { oidcKeyResolverToken, oidcOptionsToken } from './auth.constants';
import type { OidcOptions, VerifiedIdentity } from './auth.types';

@Injectable()
export class OidcTokenVerifier {
  private keyResolver?: JWTVerifyGetKey;

  constructor(
    @Inject(oidcOptionsToken) private readonly options: OidcOptions,
    @Optional()
    @Inject(oidcKeyResolverToken)
    keyResolver?: JWTVerifyGetKey,
  ) {
    this.keyResolver = keyResolver;
  }

  async verify(accessToken: string): Promise<VerifiedIdentity> {
    try {
      const { jwtVerify } = await import('jose');
      const { payload } = await jwtVerify(
        accessToken,
        await this.getKeyResolver(),
        {
          algorithms: ['RS256'],
          issuer: this.options.issuer,
          audience: this.options.audience,
          requiredClaims: ['sub'],
        },
      );

      if (
        typeof payload.iss !== 'string' ||
        typeof payload.sub !== 'string' ||
        payload.sub.length === 0
      ) {
        throw new UnauthorizedException('Invalid access token');
      }

      return {
        issuer: payload.iss,
        subject: payload.sub,
      };
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  private async getKeyResolver(): Promise<JWTVerifyGetKey> {
    if (!this.keyResolver) {
      const { createRemoteJWKSet } = await import('jose');
      this.keyResolver = createRemoteJWKSet(new URL(this.options.jwksUri));
    }

    return this.keyResolver;
  }
}
