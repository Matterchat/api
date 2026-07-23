import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  CurrentUser,
  type AuthenticatedUser,
} from 'src/auth/current-user.decorator';
import { UsersService } from './users.service';
import { StorageService } from 'src/modules/storage/storage.service';
import { type UserModel } from '@matterchat/contracts';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly storageService: StorageService,
  ) {}

  @Get('/@me')
  async getCurrentUser(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserModel> {
    return this.usersService.getUserFromAuthenticated(user);
  }

  @Post('/@me/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UserModel> {
    if (!file) throw new BadRequestException('No file provided');

    // Basic file validation
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (!allowedMimeTypes.includes(file.mimetype))
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, GIF, and WEBP images are allowed.',
      );

    // 5mb size limit
    if (file.size > 5 * 1024 * 1024)
      throw new BadRequestException('File size exceeds the limit of 5MB.');

    return this.usersService.setAvatar(user, file);
  }

  @Get('/:userId')
  async getUserById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId') userId: string,
  ): Promise<UserModel> {
    return await this.usersService.getUserById(user, userId);
  }
}
