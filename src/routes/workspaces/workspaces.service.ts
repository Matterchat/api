import {
  CreateWorkspaceBodyDto,
  WorkspaceModelDto,
} from '@matterchat/contracts';
import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from 'src/auth/current-user.decorator';
import { UsersService } from '../users/users.service';
import { db } from '@matterchat/database';
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

    // TODO: Add ownership permissions
    const membership = await db.workspaceMemberships.create({
      data: {
        userId: dbUser.id,
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
}
