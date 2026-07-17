import { Controller, Get, Param, Query } from '@nestjs/common';
import { MessagesService } from './messages.service';
import {
  type AuthenticatedUser,
  CurrentUser,
} from 'src/auth/current-user.decorator';

@Controller('/workspaces/:workspaceId/channels/:channelId/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  async getMessages(
    @Param('workspaceId') workspaceId: string,
    @Param('channelId') channelId: string,
    @Query('limit') limit: number,
    @Query('offset') offset: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.messagesService.getMessages(
      user,
      workspaceId,
      channelId,
      limit,
      offset,
    );
  }
}
