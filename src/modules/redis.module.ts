import { ApiConfiguration } from '@matterchat/config';
import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import Redis from 'ioredis';

export const RedisClient = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: RedisClient,
      useFactory: async () => {
        return new Redis(ApiConfiguration.redis.url);
      },
    },
  ],
  exports: [RedisClient],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(RedisClient) private readonly redisClient: Redis) {}

  onApplicationShutdown(signal?: string) {
    this.redisClient.disconnect();
  }
}
