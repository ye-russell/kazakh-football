import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetMatchesDto } from './dto/get-matches.dto';

@Injectable()
export class MatchesService {
  constructor(private readonly prisma: PrismaService) {}

  async getMatches(query: GetMatchesDto) {
    const competition = await this.prisma.competition.findUnique({
      where: { code: query.competition },
    });

    if (!competition) {
      throw new NotFoundException(
        `Competition with code '${query.competition}' not found`,
      );
    }

    const where = {
      competitionId: competition.id,
      ...(query.round !== undefined && { round: query.round }),
    };

    return this.prisma.match.findMany({
      where,
      include: {
        homeTeam: {
          select: {
            id: true,
            name: true,
            shortName: true,
          },
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            shortName: true,
          },
        },
      },
      orderBy: {
        kickoffAt: 'asc',
      },
    });
  }
}
