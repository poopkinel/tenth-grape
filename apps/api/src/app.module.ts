import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GamesModule } from './games/games.module';
import { SuggestionsModule } from './suggestions/suggestions.module';
import { MessagesModule } from './messages/messages.module';
import { SessionsModule } from './sessions/sessions.module';
import { PostsModule } from './posts/posts.module';
import { FriendshipsModule } from './friendships/friendships.module';
import { FeedModule } from './feed/feed.module';
import { GroupsModule } from './groups/groups.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    GamesModule,
    SuggestionsModule,
    MessagesModule,
    SessionsModule,
    PostsModule,
    FriendshipsModule,
    FeedModule,
    GroupsModule,
    EventsModule,
  ],
})
export class AppModule {}
