import { db } from '@matterchat/database';
import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from 'src/auth/current-user.decorator';

@Injectable()
export class PresenceService {
  async confirmPresence(user: AuthenticatedUser) {
    await db.user.update({
      data: {
        lastSeen: new Date(),
      },
      where: {
        id: user.userId,
      },
    });
  }
}
