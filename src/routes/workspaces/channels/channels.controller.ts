import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import {
  type AuthenticatedUser,
  CurrentUser,
} from 'src/auth/current-user.decorator';
import { CreateWorkspaceChannelDto } from '@matterchat/contracts';

@Controller('workspaces/:workspaceId/channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  async createChannel(
    @Param('workspaceId') workspaceId: string,
    @Body() body: CreateWorkspaceChannelDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.channelsService.createChannel(workspaceId, body, user);
  }

  @Get()
  async listChannels(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.channelsService.listChannels(workspaceId, user);
  }

  @Get(':channelId')
  async getChannelById(
    @Param('workspaceId') workspaceId: string,
    @Param('channelId') channelId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.channelsService.getChannelById(
      workspaceId,
      channelId,
      user,
    );
  }
}
