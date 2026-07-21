import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  UseInterceptors,
} from '@nestjs/common';
import {
  CurrentUser,
  type AuthenticatedUser,
} from 'src/auth/current-user.decorator';
import { UsersService } from './users.service';
import { type UserModel } from '@matterchat/contracts';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/@me')
  async getCurrentUser(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserModel> {
    return this.usersService.getUserFromAuthenticated(user);
  }

  @Get('/:userId')
  async getUserById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId') userId: string,
  ): Promise<UserModel> {
    return await this.usersService.getUserById(user, userId);
  }
}
