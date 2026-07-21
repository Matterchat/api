import {
  CreateWorkspaceBodyDto,
  UserModelDto,
  WorkspaceModelDto,
} from '@matterchat/contracts';
import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthenticatedUser } from 'src/auth/current-user.decorator';
import { UsersService } from '../users/users.service';
import { db, WorkspaceRole } from '@matterchat/database';
import { randomUUID } from 'crypto';

@Injectable()
export class WorkspacesService {
  constructor(private readonly usersService: UsersService) {}

  public async createWorkspace(
    body: CreateWorkspaceBodyDto,
    user: AuthenticatedUser,
  ) {
    const dbUser = await this.usersService.getUserFromAuthenticated(user);

    const workspace = await db.workspace.create({
      data: {
        id: randomUUID(),
        name: body.name,
      },
    });

    const membership = await db.workspaceMemberships.create({
      data: {
        userId: dbUser.id,
        workspaceId: workspace.id,
        role: WorkspaceRole.OWNER,
      },
    });

    await db.channel.create({
      data: {
        id: randomUUID(),
        name: 'general',
        workspaceId: workspace.id,
      },
    });

    return new WorkspaceModelDto(workspace);
  }

  public async getWorkspacesForUser(user: AuthenticatedUser) {
    const dbUser = await this.usersService.getUserFromAuthenticated(user);

    const workspaces = await db.workspace.findMany({
      where: {
        memberships: {
          some: {
            userId: dbUser.id,
          },
        },
      },
    });

    return workspaces.map((workspace) => new WorkspaceModelDto(workspace));
  }

  public async getWorkspaceById(workspaceId: string, user: AuthenticatedUser) {
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
    });
    if (!workspace)
      throw new NotFoundException('Workspace not found or access denied');

    return new WorkspaceModelDto(workspace);
  }

  public async getWorkspaceMembers(
    workspaceId: string,
    user: AuthenticatedUser,
  ) {
    const dbUser = await this.usersService.getUserFromAuthenticated(user);
    const workspace = await this.getWorkspaceById(workspaceId, user);

    const members = await db.workspaceMemberships.findMany({
      where: {
        workspaceId: workspace.id,
      },
      include: {
        user: true,
      },
    });

    return members.map((membership) => new UserModelDto(membership.user));
  }
}
