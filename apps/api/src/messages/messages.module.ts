import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MessagesController } from './messages.controller';
import { ConversationsController } from './conversations.controller';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';

@Module({
  imports: [JwtModule.register({})],
  controllers: [MessagesController, ConversationsController],
  providers: [MessagesService, MessagesGateway],
})
export class MessagesModule {}
