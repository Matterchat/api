import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from 'src/auth/current-user.decorator';
import { UsersService } from 'src/routes/users/users.service';
import { ChannelsService } from '../channels.service';
import { db } from '@matterchat/database';
import { MessageModelDto } from '@matterchat/contracts';

@Injectable()
export class MessagesService {
  constructor(
    private readonly usersService: UsersService,
    private readonly channelsService: ChannelsService,
  ) {}

  async getMessages(
    user: AuthenticatedUser,
    workspaceId: string,
    channelId: string,
    limit: number,
    offset: number,
  ) {
    const dbUser = await this.usersService.getUserFromAuthenticated(user);
    const channel = await this.channelsService.getChannelById(
      workspaceId,
      channelId,
      user,
    );

    const messages = await db.message.findMany({
      skip: offset,
      take: limit,
      orderBy: {
        createdAt: 'asc',
      },
      where: {
        channelId: channel.id,
      },
    });

    return messages.map((msg) => new MessageModelDto(msg));
  }
}
