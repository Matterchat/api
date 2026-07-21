import {
  CreateWorkspaceOfficeDto,
  WorkspaceOfficeModelDto,
} from '@matterchat/contracts';
import { db, WorkspaceRole } from '@matterchat/database';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedUser } from 'src/auth/current-user.decorator';
import { UsersService } from 'src/routes/users/users.service';
import { ApiConfiguration } from '@matterchat/config';
import { AccessToken } from 'livekit-server-sdk';

@Injectable()
export class OfficesService {
  constructor(private readonly usersService: UsersService) {}

  async getOffices(workspaceId: string, user: AuthenticatedUser) {
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

    const offices = await db.office.findMany({
      where: {
        workspaceId: workspace.id,
      },
    });

    return offices.map((office) => new WorkspaceOfficeModelDto(office));
  }

  async createOffice(
    workspaceId: string,
    body: CreateWorkspaceOfficeDto,
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
        'User does not have permission to create offices',
      );

    const office = await db.office.create({
      data: {
        name: body.name,
        workspaceId: workspace.id,
      },
    });

    return new WorkspaceOfficeModelDto(office);
  }

  async getOfficeToken(
    workspaceId: string,
    officeId: string,
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
    });
    if (!workspace)
      throw new NotFoundException(
        'Workspace not found or user is not a member',
      );

    const office = await db.office.findFirst({
      where: {
        id: officeId,
        workspaceId: workspace.id,
      },
    });
    if (!office) throw new NotFoundException('Office not found');

    const apiKey = ApiConfiguration.livekit.apiKey;
    const apiSecret = ApiConfiguration.livekit.apiSecret;
    const lkUrl = ApiConfiguration.livekit.url;

    const at = new AccessToken(apiKey, apiSecret, {
      identity: dbUser.id,
      name: dbUser.fullName || dbUser.email,
    });

    at.addGrant({
      roomJoin: true,
      room: office.id,
      canPublish: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();

    return {
      token,
      url: lkUrl,
    };
  }
}
