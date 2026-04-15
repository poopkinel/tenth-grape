import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FeedService } from './feed.service';
import { FeedQueryDto } from './dto/feed-query.dto';

@Controller('feed')
@UseGuards(JwtAuthGuard)
export class FeedController {
  constructor(private feedService: FeedService) {}

  @Get()
  getFeed(@Req() req: Request, @Query() query: FeedQueryDto) {
    return this.feedService.getHomeFeed(
      (req.user as User).id,
      query.cursor,
      query.limit ?? 20,
    );
  }
}
