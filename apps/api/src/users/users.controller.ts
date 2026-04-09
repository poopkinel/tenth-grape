import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { AddGameDto } from './dto/add-game.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  getMe(@Req() req: Request) {
    return this.usersService.getMe((req.user as User).id);
  }

  @Patch('me')
  updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile((req.user as User).id, dto);
  }

  @Patch('me/location')
  updateLocation(@Req() req: Request, @Body() dto: UpdateLocationDto) {
    return this.usersService.updateLocation((req.user as User).id, dto);
  }

  @Get('me/games')
  listGames(@Req() req: Request) {
    return this.usersService.listGames((req.user as User).id);
  }

  @Post('me/games')
  addGame(@Req() req: Request, @Body() dto: AddGameDto) {
    return this.usersService.addGame((req.user as User).id, dto);
  }

  @Delete('me/games/:bggId')
  removeGame(@Req() req: Request, @Param('bggId', ParseIntPipe) bggId: number) {
    return this.usersService.removeGame((req.user as User).id, bggId);
  }
}
