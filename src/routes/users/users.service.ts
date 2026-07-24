import { UserModelDto } from '@matterchat/contracts';
import { db } from '@matterchat/database';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthenticatedUser } from 'src/auth/current-user.decorator';
import { StorageService } from 'src/modules/storage/storage.service';
import {} from 'multer';
import axios from 'axios';

@Injectable()
export class UsersService {
  constructor(private readonly storageService: StorageService) {}

  // TODO: Add webhook sync between keycloak and database to keep user data in sync?
  async $upsertUser(userId: string, email: string, fullName: string) {
    if (typeof userId !== 'string' || userId.trim().length < 1)
      throw new UnauthorizedException('Invalid userId');

    if (typeof email !== 'string' || email.trim().length < 1)
      throw new UnauthorizedException('Invalid email');

    if (typeof fullName !== 'string' || fullName.trim().length < 1)
      throw new UnauthorizedException('Invalid fullName');

    const existingUser = await db.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (existingUser) {
      // Set default avatar if the user doesn't have one yet (migration from before avatars were added)
      if (existingUser.avatarUrl === '') {
        const avatarUrl = await this.getDefaultAvatarUrl(userId, fullName);

        await db.user.update({
          where: {
            id: userId,
          },
          data: {
            avatarUrl: avatarUrl,
          },
        });
      }

      if (existingUser.email === email && existingUser.fullName === fullName)
        return;

      await db.user.update({
        where: {
          id: userId,
        },
        data: {
          email: email,
          fullName: fullName,
        },
      });

      return;
    }

    const avatarUrl = await this.getDefaultAvatarUrl(userId, fullName);

    await db.user.create({
      data: {
        id: userId,
        email: email,
        fullName: fullName,
        avatarUrl: avatarUrl,
      },
    });
  }

  private async getDefaultAvatarUrl(userId: string, fullName: string) {
    const profilePic = await axios.get(
      `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(fullName)}&size=512`,
      {
        responseType: 'arraybuffer',
      },
    );

    const avatarUrl = await this.storageService.uploadAvatar(
      Buffer.from(profilePic.data),
      profilePic.headers['content-type'] as string,
      userId,
    );

    return avatarUrl;
  }

  async getUserFromAuthenticated(user: AuthenticatedUser) {
    const dbUser = await db.user.findUnique({
      where: {
        id: user.userId,
      },
    });
    if (!dbUser) throw new NotFoundException('User not found');

    return new UserModelDto(dbUser);
  }

  async getUserById(user: AuthenticatedUser, userId: string) {
    const dbUser = await this.getUserFromAuthenticated(user);

    // Check if the current user and the requested user have
    // any shared workspaces
    const sharedWorkspaces = await db.workspace.findMany({
      where: {
        AND: [
          {
            memberships: {
              some: {
                userId: dbUser.id,
              },
            },
          },
          {
            memberships: {
              some: {
                userId: userId,
              },
            },
          },
        ],
      },
    });

    if (sharedWorkspaces.length === 0)
      throw new UnauthorizedException(
        'You do not have permission to view this user',
      );

    const requestedUser = await db.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!requestedUser) throw new NotFoundException('User not found');

    return new UserModelDto(requestedUser);
  }

  async setAvatar(user: AuthenticatedUser, avatarFile: Express.Multer.File) {
    const dbUser = await this.getUserFromAuthenticated(user);

    const avatarUrl = await this.storageService.uploadAvatar(
      avatarFile.buffer,
      avatarFile.mimetype,
      dbUser.id,
    );

    const updatedUser = await db.user.update({
      where: {
        id: dbUser.id,
      },
      data: {
        avatarUrl: avatarUrl,
      },
    });

    return new UserModelDto(updatedUser);
  }
}
