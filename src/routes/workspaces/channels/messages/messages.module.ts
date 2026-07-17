import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { ChannelsModule } from '../channels.module';

@Module({
  imports: [ChannelsModule],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
