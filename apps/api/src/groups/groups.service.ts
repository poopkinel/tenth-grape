import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupRole } from '@prisma/client';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateGroupDto) {
    return this.prisma.group.create({
      data: {
        ...dto,
        members: {
          create: { userId: ownerId, role: GroupRole.OWNER },
        },
      },
      include: { _count: { select: { members: true } } },
    });
  }

  async listMyGroups(userId: string) {
    const groups = await this.prisma.group.findMany({
      where: { members: { some: { userId } } },
      include: { _count: { select: { members: true } } },
      orderBy: { updatedAt: 'desc' },
    });

    return groups.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      coverImage: g.coverImage,
      memberCount: g._count.members,
      createdAt: g.createdAt.toISOString(),
    }));
  }

  async getById(groupId: string, viewerId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });
    if (!group) throw new NotFoundException('Group not found');

    const myMembership = group.members.find((m) => m.userId === viewerId);

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      coverImage: group.coverImage,
      memberCount: group.members.length,
      createdAt: group.createdAt.toISOString(),
      myRole: myMembership?.role ?? null,
      members: group.members.map((m) => ({
        userId: m.userId,
        name: m.user.name,
        avatar: m.user.avatar,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
      })),
    };
  }

  async invite(groupId: string, inviterId: string, userIds: string[]) {
    await this.ensureMember(groupId, inviterId);

    // Dedupe + skip anyone already a member
    const existing = await this.prisma.groupMember.findMany({
      where: { groupId, userId: { in: userIds } },
      select: { userId: true },
    });
    const existingIds = new Set(existing.map((e) => e.userId));
    const toAdd = userIds.filter((id) => !existingIds.has(id));

    if (toAdd.length === 0) return { added: 0 };

    await this.prisma.groupMember.createMany({
      data: toAdd.map((userId) => ({ groupId, userId, role: GroupRole.MEMBER })),
      skipDuplicates: true,
    });

    return { added: toAdd.length };
  }

  async leave(groupId: string, userId: string) {
    const membership = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!membership) throw new NotFoundException('Not a member of this group');

    if (membership.role === GroupRole.OWNER) {
      // An owner leaving: if there are other members, refuse; otherwise delete the group
      const otherCount = await this.prisma.groupMember.count({
        where: { groupId, NOT: { userId } },
      });
      if (otherCount > 0) {
        throw new BadRequestException(
          'Transfer ownership before leaving the group',
        );
      }
      await this.prisma.group.delete({ where: { id: groupId } });
      return;
    }

    await this.prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId } },
    });
  }

  async kick(groupId: string, ownerId: string, targetUserId: string) {
    const owner = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: ownerId } },
    });
    if (!owner || owner.role !== GroupRole.OWNER) {
      throw new ForbiddenException('Only the owner can remove members');
    }
    if (targetUserId === ownerId) {
      throw new BadRequestException('Use leave, not kick, for yourself');
    }
    await this.prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });
  }

  private async ensureMember(groupId: string, userId: string) {
    const m = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!m) throw new ForbiddenException('Not a member of this group');
  }
}
