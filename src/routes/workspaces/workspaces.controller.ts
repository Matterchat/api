import { Body, Controller, Get, Post } from '@nestjs/common';
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
}
