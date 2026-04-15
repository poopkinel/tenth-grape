import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamesService } from '../games/games.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { AddGameDto } from './dto/add-game.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private gamesService: GamesService,
  ) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user) throw new NotFoundException();
    const { passwordHash, ...rest } = user;
    return rest;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const { name, ...profileFields } = dto;

    if (name) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { name },
      });
    }

    if (Object.keys(profileFields).length > 0) {
      await this.prisma.profile.update({
        where: { userId },
        data: profileFields,
      });
    }

    return this.getMe(userId);
  }

  async updateLocation(userId: string, dto: UpdateLocationDto) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lat: dto.lat, lng: dto.lng },
    });
    return { lat: dto.lat, lng: dto.lng };
  }

  async listGames(userId: string) {
    return this.prisma.userGame.findMany({
      where: { userId },
      include: { game: true },
      orderBy: { addedAt: 'desc' },
    });
  }

  async addGame(userId: string, dto: AddGameDto) {
    // Auto-fetch from BGG if game doesn't exist in our DB yet
    await this.gamesService.getGame(dto.bggId);

    return this.prisma.userGame.upsert({
      where: { userId_bggId: { userId, bggId: dto.bggId } },
      create: {
        userId,
        bggId: dto.bggId,
        ownership: dto.ownership,
        personalRating: dto.personalRating,
      },
      update: {
        ownership: dto.ownership,
        personalRating: dto.personalRating,
      },
      include: { game: true },
    });
  }

  async removeGame(userId: string, bggId: number) {
    await this.prisma.userGame.delete({
      where: { userId_bggId: { userId, bggId } },
    });
  }
}
