import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { OfficesService } from './offices.service';
import {
  type AuthenticatedUser,
  CurrentUser,
} from 'src/auth/current-user.decorator';
import {
  CreateWorkspaceOfficeDto,
  OfficeTokenResponseDto,
} from '@matterchat/contracts';

@Controller('workspaces/:workspaceId/offices')
export class OfficesController {
  constructor(private readonly officesService: OfficesService) {}

  @Get()
  async getOffices(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.officesService.getOffices(workspaceId, user);
  }

  @Post()
  async createOffice(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateWorkspaceOfficeDto,
  ) {
    return this.officesService.createOffice(workspaceId, body, user);
  }

  @Get(':officeId/token')
  async getOfficeToken(
    @Param('workspaceId') workspaceId: string,
    @Param('officeId') officeId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OfficeTokenResponseDto> {
    return this.officesService.getOfficeToken(workspaceId, officeId, user);
  }
}
