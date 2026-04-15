import { Module } from '@nestjs/common';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { PostsModule } from '../posts/posts.module';
import { FriendshipsModule } from '../friendships/friendships.module';

@Module({
  imports: [PostsModule, FriendshipsModule],
  controllers: [FeedController],
  providers: [FeedService],
})
export class FeedModule {}
