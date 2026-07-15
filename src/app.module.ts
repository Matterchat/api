import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './auth/jwt.strategy';
import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { UsersModule } from './routes/users/users.module';
import { WorkspacesModule } from './routes/workspaces/workspaces.module';
import { ChannelsModule } from './routes/workspaces/channels/channels.module';
import { GatewayModule } from './routes/gateway/gateway.module';
import { RedisModule } from './modules/redis.module';

@Module({
  imports: [
    PassportModule,
    RedisModule,

    // Routes
    UsersModule,
    WorkspacesModule,
    ChannelsModule,
    GatewayModule,
  ],
  controllers: [],
  providers: [
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
