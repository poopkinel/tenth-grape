import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuggestionsService } from './suggestions.service';
import { PlayersForGameQueryDto } from './dto/players-for-game-query.dto';
import { EventPlayersQueryDto } from './dto/event-players-query.dto';
import { GroupsSuggestionQueryDto } from './dto/groups-query.dto';

@Controller('suggestions')
@UseGuards(JwtAuthGuard)
export class SuggestionsController {
  constructor(private suggestions: SuggestionsService) {}

  @Get('players')
  playersForGame(@Req() req: Request, @Query() query: PlayersForGameQueryDto) {
    return this.suggestions.playersForGame(
      (req.user as User).id,
      query.bggId,
      query.radiusKm ?? 50,
      query.limit ?? 20,
    );
  }

  @Get('players-for-event')
  playersForEvent(@Req() req: Request, @Query() query: EventPlayersQueryDto) {
    return this.suggestions.playersForEvent(
      (req.user as User).id,
      query.eventId,
      query.limit ?? 20,
    );
  }

  @Get('groups')
  groups(@Req() req: Request, @Query() query: GroupsSuggestionQueryDto) {
    return this.suggestions.groupsForUser(
      (req.user as User).id,
      query.limit ?? 20,
    );
  }
}
