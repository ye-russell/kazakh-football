import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTeams() {
    return this.prisma.team.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getTeamById(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        shortName: true,
        city: true,
        logoUrl: true,
      },
    });

    if (!team) {
      throw new NotFoundException(`Team with id '${id}' not found`);
    }

    return team;
  }
}
