import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FriendshipsService } from './friendships.service';
import { SendFriendRequestDto } from './dto/send-request.dto';

@Controller('friendships')
@UseGuards(JwtAuthGuard)
export class FriendshipsController {
  constructor(private friendships: FriendshipsService) {}

  @Get()
  listFriends(@Req() req: Request) {
    return this.friendships.listFriends((req.user as User).id);
  }

  @Get('requests')
  listRequests(@Req() req: Request) {
    return this.friendships.listRequests((req.user as User).id);
  }

  @Post()
  send(@Req() req: Request, @Body() dto: SendFriendRequestDto) {
    return this.friendships.sendRequest((req.user as User).id, dto.toUserId);
  }

  @Patch(':id/accept')
  accept(@Req() req: Request, @Param('id') id: string) {
    return this.friendships.accept(id, (req.user as User).id);
  }

  @Delete(':id')
  declineOrCancel(@Req() req: Request, @Param('id') id: string) {
    return this.friendships.decline(id, (req.user as User).id);
  }

  @Delete('friend/:otherUserId')
  unfriend(@Req() req: Request, @Param('otherUserId') otherUserId: string) {
    return this.friendships.removeFriend((req.user as User).id, otherUserId);
  }

  @Post('block/:otherUserId')
  block(@Req() req: Request, @Param('otherUserId') otherUserId: string) {
    return this.friendships.block((req.user as User).id, otherUserId);
  }
}
