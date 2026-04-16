import { Module } from '@nestjs/common';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { PostsModule } from '../posts/posts.module';
import { FriendshipsModule } from '../friendships/friendships.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [PostsModule, FriendshipsModule, EventsModule],
  controllers: [FeedController],
  providers: [FeedService],
})
export class FeedModule {}
