import { UserModelDto } from '@matterchat/contracts';
import { db } from '@matterchat/database';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthenticatedUser } from 'src/auth/current-user.decorator';

@Injectable()
export class UsersService {
  // TODO: Add webhook sync between keycloak and database to keep user data in sync?
  async $upsertUser(userId: string, email: string, fullName: string) {
    if (typeof userId !== 'string' || userId.trim().length < 1)
      throw new UnauthorizedException('Invalid userId');

    if (typeof email !== 'string' || email.trim().length < 1)
      throw new UnauthorizedException('Invalid email');

    if (typeof fullName !== 'string' || fullName.trim().length < 1)
      throw new UnauthorizedException('Invalid fullName');

    await db.user.upsert({
      create: {
        id: userId,
        email: email,
        fullName: fullName,
      },
      update: {
        id: userId,
        email: email,
        fullName: fullName,
      },
      where: {
        id: userId,
      },
    });
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
}
