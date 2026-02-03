import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetStandingsDto } from './dto/get-standings.dto';
import { computeStandings, MatchForStandings } from './standings.utils';

@Injectable()
export class StandingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStandings(query: GetStandingsDto) {
    const competition = await this.prisma.competition.findUnique({
      where: { code: query.competition },
    });

    if (!competition) {
      throw new NotFoundException(
        `Competition with code '${query.competition}' not found`,
      );
    }

    const matches = await this.prisma.match.findMany({
      where: {
        competitionId: competition.id,
        status: 'finished',
        homeScore: { not: null },
        awayScore: { not: null },
      },
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
    });

    // Fetch all teams to include teams with 0 played
    const allTeams = await this.prisma.team.findMany({
      select: {
        id: true,
        name: true,
        shortName: true,
      },
    });

    // Transform matches to the format needed by computeStandings
    const matchesForStandings: MatchForStandings[] = matches.map((match) => ({
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeScore: match.homeScore!,
      awayScore: match.awayScore!,
    }));

    return computeStandings(matchesForStandings, allTeams);
  }
}
