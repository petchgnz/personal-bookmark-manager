import { Controller, Get } from '@nestjs/common';
import { CurrentUserIdentity } from './current-user.decorator';
import type { CurrentUser } from './auth.types';

@Controller('me')
export class MeController {
  @Get()
  getMe(@CurrentUserIdentity() user: CurrentUser): CurrentUser {
    return user;
  }
}
