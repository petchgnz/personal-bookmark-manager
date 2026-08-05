import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type { CurrentUser, VerifiedIdentity } from './auth.types';

@Injectable()
export class UserProvisioningService {
  constructor(private readonly prisma: PrismaService) {}

  async provision(identity: VerifiedIdentity): Promise<CurrentUser> {
    return this.prisma.user.upsert({
      where: {
        externalIssuer_externalSubject: {
          externalIssuer: identity.issuer,
          externalSubject: identity.subject,
        },
      },
      update: {},
      create: {
        externalIssuer: identity.issuer,
        externalSubject: identity.subject,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
