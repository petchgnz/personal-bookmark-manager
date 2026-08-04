import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { defaultOidcOptions, oidcOptionsToken } from './auth.constants';
import type { OidcOptions } from './auth.types';
import { MeController } from './me.controller';
import { OidcTokenVerifier } from './oidc-token-verifier.service';
import { UserProvisioningService } from './user-provisioning.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [MeController],
  providers: [
    {
      provide: oidcOptionsToken,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): OidcOptions => ({
        issuer:
          configService.get<string>('OIDC_ISSUER') ?? defaultOidcOptions.issuer,
        audience:
          configService.get<string>('OIDC_AUDIENCE') ??
          defaultOidcOptions.audience,
        jwksUri:
          configService.get<string>('OIDC_JWKS_URI') ??
          defaultOidcOptions.jwksUri,
      }),
    },
    OidcTokenVerifier,
    UserProvisioningService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports: [OidcTokenVerifier, UserProvisioningService],
})
export class AuthModule {}
