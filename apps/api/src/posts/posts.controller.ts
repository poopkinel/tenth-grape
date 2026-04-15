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
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ReactDto } from './dto/react.dto';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Post()
  create(@Req() req: Request, @Body() dto: CreatePostDto) {
    return this.postsService.create((req.user as User).id, dto);
  }

  @Get(':id')
  getOne(@Req() req: Request, @Param('id') id: string) {
    return this.postsService.getById(id, (req.user as User).id);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.postsService.delete(id, (req.user as User).id);
  }

  // ─── Reactions ────────────────────────────────────────────────────────────

  @Post(':id/reactions')
  react(@Req() req: Request, @Param('id') id: string, @Body() dto: ReactDto) {
    return this.postsService.react(id, (req.user as User).id, dto.emoji);
  }

  @Delete(':id/reactions')
  unreact(@Req() req: Request, @Param('id') id: string) {
    return this.postsService.unreact(id, (req.user as User).id);
  }

  // ─── Comments ─────────────────────────────────────────────────────────────

  @Get(':id/comments')
  getComments(@Param('id') id: string) {
    return this.postsService.getComments(id);
  }

  @Post(':id/comments')
  addComment(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.postsService.addComment(id, (req.user as User).id, dto);
  }

  @Delete('comments/:commentId')
  deleteComment(@Req() req: Request, @Param('commentId') commentId: string) {
    return this.postsService.deleteComment(commentId, (req.user as User).id);
  }
}
