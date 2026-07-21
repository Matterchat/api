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

  public async createInvite(workspaceId: string, user: AuthenticatedUser) {
    const dbUser = await this.usersService.getUserFromAuthenticated(user);
    const workspace = await this.getWorkspaceById(workspaceId, user);

    const membership = await db.workspaceMemberships.findFirst({
      where: {
        userId: dbUser.id,
        workspaceId: workspace.id,
      },
    });

    if (
      !membership ||
      (membership.role !== WorkspaceRole.OWNER &&
        membership.role !== WorkspaceRole.ADMIN)
    )
      throw new NotFoundException(
        'You do not have permission to create invites for this workspace',
      );

    const invite = await db.invite.create({
      data: {
        workspaceId: workspace.id,
        creatorId: dbUser.id,
      },
    });

    return invite;
  }

  public async getInviteById(inviteId: string) {
    const invite = await db.invite.findUnique({
      where: {
        id: inviteId,
      },
      include: {
        workspace: true,
      },
    });

    if (!invite) throw new NotFoundException('Invite not found');

    return invite;
  }

  public async acceptInvite(inviteId: string, user: AuthenticatedUser) {
    const dbUser = await this.usersService.getUserFromAuthenticated(user);
    const invite = await this.getInviteById(inviteId);

    const existingMembership = await db.workspaceMemberships.findFirst({
      where: {
        userId: dbUser.id,
        workspaceId: invite.workspaceId,
      },
    });

    if (existingMembership)
      throw new NotFoundException('You are already a member of this workspace');

    const membership = await db.workspaceMemberships.create({
      data: {
        userId: dbUser.id,
        workspaceId: invite.workspaceId,
        role: WorkspaceRole.MEMBER,
      },
    });

    const workspace = await db.workspace.findUnique({
      where: {
        id: invite.workspaceId,
      },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    await db.invite.delete({
      where: {
        id: invite.id,
      },
    });

    return new WorkspaceModelDto(workspace);
  }
}
