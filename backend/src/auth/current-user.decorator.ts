import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest, CurrentUser } from './auth.types';

export const CurrentUserIdentity = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
