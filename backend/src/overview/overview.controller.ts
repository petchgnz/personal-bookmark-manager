import { Controller, Get } from '@nestjs/common';
import type { CurrentUser } from '../auth/auth.types';
import { CurrentUserIdentity } from '../auth/current-user.decorator';
import { OverviewService } from './overview.service';

@Controller('all')
export class OverviewController {
  constructor(private readonly overviewService: OverviewService) {}

  @Get()
  findAll(@CurrentUserIdentity() user: CurrentUser) {
    return this.overviewService.findAll(user.id);
  }
}
