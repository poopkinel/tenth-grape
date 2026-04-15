import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { CompleteSessionDto } from './dto/complete-session.dto';
import { RsvpDto } from './dto/rsvp.dto';
import { NearbyQueryDto } from './dto/nearby-query.dto';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Post()
  create(@Req() req: Request, @Body() dto: CreateSessionDto) {
    return this.sessionsService.create((req.user as User).id, dto);
  }

  @Get('mine')
  getMySessions(@Req() req: Request) {
    return this.sessionsService.getMySessions((req.user as User).id);
  }

  @Get('nearby')
  findNearby(@Query() query: NearbyQueryDto) {
    return this.sessionsService.findNearby(query.lat, query.lng, query.radiusKm!);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.sessionsService.getById(id);
  }

  @Patch(':id/rsvp')
  rsvp(@Req() req: Request, @Param('id') id: string, @Body() dto: RsvpDto) {
    return this.sessionsService.rsvp(id, (req.user as User).id, dto.status);
  }

  @Post(':id/complete')
  complete(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: CompleteSessionDto,
  ) {
    return this.sessionsService.complete(id, (req.user as User).id, dto);
  }

  @Delete(':id')
  cancel(@Req() req: Request, @Param('id') id: string) {
    return this.sessionsService.cancel(id, (req.user as User).id);
  }
}
