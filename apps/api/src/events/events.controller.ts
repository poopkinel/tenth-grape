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
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { RsvpEventDto } from './dto/rsvp-event.dto';
import { NearbyEventsDto } from './dto/nearby-events.dto';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private events: EventsService) {}

  @Get('mine')
  listMine(@Req() req: Request) {
    return this.events.listMine((req.user as User).id);
  }

  @Get('nearby')
  findNearby(@Req() req: Request, @Query() query: NearbyEventsDto) {
    return this.events.findNearby(
      (req.user as User).id,
      query.lat,
      query.lng,
      query.radiusKm ?? 50,
    );
  }

  @Post()
  create(@Req() req: Request, @Body() dto: CreateEventDto) {
    return this.events.create((req.user as User).id, dto);
  }

  @Get(':id')
  getById(@Req() req: Request, @Param('id') id: string) {
    return this.events.getById(id, (req.user as User).id);
  }

  @Patch(':id/rsvp')
  rsvp(@Req() req: Request, @Param('id') id: string, @Body() dto: RsvpEventDto) {
    return this.events.rsvp(id, (req.user as User).id, dto.status);
  }

  @Delete(':id')
  cancel(@Req() req: Request, @Param('id') id: string) {
    return this.events.cancel(id, (req.user as User).id);
  }
}
