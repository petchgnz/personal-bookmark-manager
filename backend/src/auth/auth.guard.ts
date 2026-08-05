import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { OidcTokenVerifier } from './oidc-token-verifier.service';
import { UserProvisioningService } from './user-provisioning.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokenVerifier: OidcTokenVerifier,
    private readonly userProvisioning: UserProvisioningService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearerToken(request.headers.authorization);
    const identity = await this.verifyToken(token);
    const user = await this.userProvisioning.provision(identity);

    Object.assign(request, { user });

    return true;
  }

  private extractBearerToken(authorization?: string): string {
    const match = authorization?.match(/^Bearer\s+(\S+)$/i);

    if (!match) {
      throw new UnauthorizedException({
        code: 'UNAUTHENTICATED',
        message: 'Bearer token required',
      });
    }

    return match[1];
  }

  private async verifyToken(token: string) {
    try {
      return await this.tokenVerifier.verify(token);
    } catch {
      throw new UnauthorizedException({
        code: 'INVALID_TOKEN',
        message: 'Invalid access token',
      });
    }
  }
}
