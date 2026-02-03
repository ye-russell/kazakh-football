import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeagueService {
  constructor(private readonly prisma: PrismaService) {}

  async getLeagueInfo() {
    const competitions = await this.prisma.competition.findMany({
      select: {
        code: true,
        name: true,
        season: true,
      },
      orderBy: {
        code: 'asc',
      },
    });

    return {
      appName: 'Kazakh Football',
      season: 2026,
      competitions,
    };
  }
}
