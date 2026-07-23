import { Controller, Post } from '@nestjs/common';
import { PresenceService } from './presence.service';
import {
  type AuthenticatedUser,
  CurrentUser,
} from 'src/auth/current-user.decorator';

@Controller('users/presence')
export class PresenceController {
  constructor(private readonly presenceService: PresenceService) {}

  @Post()
  async confirmPresence(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    return await this.presenceService.confirmPresence(user);
  }
}
