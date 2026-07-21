import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import {
  CreateWorkspaceBodyDto,
  WorkspaceModelDto,
} from '@matterchat/contracts';
import {
  type AuthenticatedUser,
  CurrentUser,
} from 'src/auth/current-user.decorator';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  async createWorkspace(
    @Body() body: CreateWorkspaceBodyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.workspacesService.createWorkspace(body, user);
  }

  @Get()
  async listWorkspaces(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<WorkspaceModelDto[]> {
    return await this.workspacesService.getWorkspacesForUser(user);
  }

  @Get(':workspaceId')
  async getWorkspaceById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceId') workspaceId: string,
  ): Promise<WorkspaceModelDto> {
    return await this.workspacesService.getWorkspaceById(workspaceId, user);
  }

  @Get(':workspaceId/members')
  async getWorkspaceMembers(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceId') workspaceId: string,
  ) {
    return await this.workspacesService.getWorkspaceMembers(workspaceId, user);
  }
}
