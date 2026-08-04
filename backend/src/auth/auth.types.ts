import type { Request } from 'express';

export interface OidcOptions {
  issuer: string;
  audience: string;
  jwksUri: string;
}

export interface VerifiedIdentity {
  issuer: string;
  subject: string;
}

export interface CurrentUser {
  id: string;
  email: string | null;
  displayName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticatedRequest extends Request {
  user: CurrentUser;
}
