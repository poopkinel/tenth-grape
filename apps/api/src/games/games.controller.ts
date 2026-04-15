import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GamesService } from './games.service';

@Controller('games')
@UseGuards(JwtAuthGuard)
export class GamesController {
  constructor(private gamesService: GamesService) {}

  @Get('search')
  search(@Query('q') query: string) {
    if (!query || query.length < 2) return [];
    return this.gamesService.search(query);
  }

  @Get(':bggId')
  getGame(@Param('bggId', ParseIntPipe) bggId: number) {
    return this.gamesService.getGame(bggId);
  }
}
