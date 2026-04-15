import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { InviteDto } from './dto/invite.dto';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private groups: GroupsService) {}

  @Get('mine')
  listMine(@Req() req: Request) {
    return this.groups.listMyGroups((req.user as User).id);
  }

  @Post()
  create(@Req() req: Request, @Body() dto: CreateGroupDto) {
    return this.groups.create((req.user as User).id, dto);
  }

  @Get(':id')
  getById(@Req() req: Request, @Param('id') id: string) {
    return this.groups.getById(id, (req.user as User).id);
  }

  @Post(':id/invite')
  invite(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: InviteDto,
  ) {
    return this.groups.invite(id, (req.user as User).id, dto.userIds);
  }

  @Post(':id/leave')
  leave(@Req() req: Request, @Param('id') id: string) {
    return this.groups.leave(id, (req.user as User).id);
  }

  @Delete(':id/members/:userId')
  kick(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.groups.kick(id, (req.user as User).id, userId);
  }
}
