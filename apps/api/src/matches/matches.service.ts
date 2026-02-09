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

  async getMatchById(id: string) {
    const match = await this.prisma.match.findUnique({
      where: { id },
      select: {
        id: true,
        round: true,
        kickoffAt: true,
        status: true,
        homeScore: true,
        awayScore: true,
        competition: {
          select: {
            code: true,
          },
        },
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
        events: {
          orderBy: {
            minute: 'asc',
          },
          select: {
            id: true,
            minute: true,
            type: true,
            player: {
              select: {
                id: true,
                name: true,
                number: true,
              },
            },
            team: {
              select: {
                id: true,
                name: true,
                shortName: true,
              },
            },
          },
        },
      },
    });

    if (!match) {
      throw new NotFoundException(`Match with id '${id}' not found`);
    }

    return match;
  }
}
