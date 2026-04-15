import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IsString } from 'class-validator';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessagesService } from './messages.service';

class OpenConversationDto {
  @IsString()
  otherUserId: string;
}

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private messagesService: MessagesService) {}

  @Get()
  list(@Req() req: Request) {
    return this.messagesService.listConversations((req.user as User).id);
  }

  /** Get-or-create a 1:1 conversation with another user. */
  @Post('open')
  open(@Req() req: Request, @Body() dto: OpenConversationDto) {
    return this.messagesService.getOrCreateConversation(
      (req.user as User).id,
      dto.otherUserId,
    );
  }
}
