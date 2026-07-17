import { Inject, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AuthenticatedUser } from 'src/auth/current-user.decorator';
import { RedisClient } from 'src/modules/redis.module';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';
import { GatewayTicketResponseDto } from '@matterchat/contracts';
import { User } from '@matterchat/database';

@Injectable()
export class GatewayService {
  constructor(
    private readonly usersService: UsersService,
    @Inject(RedisClient) private readonly redisClient: Redis,
  ) {}

  async requestTicket(user: AuthenticatedUser) {
    const dbUser = await this.usersService.getUserFromAuthenticated(user);

    const ticketId = randomUUID();
    await this.redisClient.set(
      `gateway:ticket:${ticketId}`,
      dbUser.id,
      'EX',
      30,
    );

    return new GatewayTicketResponseDto(ticketId);
  }
}
