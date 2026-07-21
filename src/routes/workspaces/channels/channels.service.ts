import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateWorkspaceChannelDto,
  WorkspaceChannelModelDto,
} from '@matterchat/contracts';
import { AuthenticatedUser } from 'src/auth/current-user.decorator';
import { WorkspacesService } from '../workspaces.service';
import { UsersService } from 'src/routes/users/users.service';
import { db, WorkspaceRole } from '@matterchat/database';
import { randomUUID } from 'crypto';

@Injectable()
export class ChannelsService {
  constructor(
    private readonly usersService: UsersService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async createChannel(
    workspaceId: string,
    body: CreateWorkspaceChannelDto,
    user: AuthenticatedUser,
  ) {
    const dbUser = await this.usersService.getUserFromAuthenticated(user);
    const workspace = await db.workspace.findFirst({
      where: {
        id: workspaceId,
        memberships: {
          some: {
            userId: dbUser.id,
          },
        },
      },
      select: {
        id: true,
        name: true,
        memberships: true,
      },
    });
    if (!workspace)
      throw new NotFoundException(
        'Workspace not found or user is not a member',
      );

    const userRole = workspace.memberships.find(
      (membership) => membership.userId === dbUser.id,
    )!.role;
    if (userRole !== WorkspaceRole.OWNER && userRole !== WorkspaceRole.ADMIN)
      throw new ForbiddenException(
        'User does not have permission to create channels',
      );

    const channel = await db.channel.create({
      data: {
        name: body.name,
        workspaceId: workspace.id,
      },
    });

    return new WorkspaceChannelModelDto(channel);
  }

  async listChannels(workspaceId: string, user: AuthenticatedUser) {
    const dbUser = await this.usersService.getUserFromAuthenticated(user);
    const workspace = await db.workspace.findFirst({
      where: {
        id: workspaceId,
        memberships: {
          some: {
            userId: dbUser.id,
          },
        },
      },
      select: {
        id: true,
        name: true,
        memberships: true,
      },
    });
    if (!workspace)
      throw new NotFoundException(
        'Workspace not found or user is not a member',
      );

    const channels = await db.channel.findMany({
      where: {
        workspaceId: workspace.id,
      },
    });

    return channels.map((channel) => new WorkspaceChannelModelDto(channel));
  }

  async getChannelById(
    workspaceId: string,
    channelId: string,
    user: AuthenticatedUser,
  ) {
    const dbUser = await this.usersService.getUserFromAuthenticated(user);
    const workspace = await this.workspacesService.getWorkspaceById(
      workspaceId,
      user,
    );

    const channel = await db.channel.findFirst({
      where: {
        id: channelId,
        workspaceId: workspace.id,
      },
    });

    if (!channel)
      throw new NotFoundException(
        'Channel not found or user is not a member of the workspace',
      );

    return new WorkspaceChannelModelDto(channel);
  }
}
