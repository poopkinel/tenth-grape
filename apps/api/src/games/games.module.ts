import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { GamesService } from './games.service';
import { BggService } from './bgg.service';

@Module({
  controllers: [GamesController],
  providers: [GamesService, BggService],
  exports: [GamesService],
})
export class GamesModule {}
