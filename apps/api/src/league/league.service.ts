import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeagueService {
  constructor(private readonly prisma: PrismaService) {}

  async getLeagueInfo() {
    const competitions = await this.prisma.competition.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        season: true,
      },
      orderBy: {
        code: 'asc',
      },
    });

    const allRounds = await this.prisma.match.groupBy({
      by: ['competitionId'],
      _max: {
        round: true,
      },
      _min: {
        round: true,
      },
    });

    const playedRounds = await this.prisma.match.groupBy({
      by: ['competitionId'],
      where: {
        status: {
          in: ['live', 'finished'],
        },
      },
      _max: {
        round: true,
      },
    });

    const maxRoundByCompetition = new Map(
      allRounds.map((row) => [row.competitionId, row._max.round ?? null])
    );

    const minRoundByCompetition = new Map(
      allRounds.map((row) => [row.competitionId, row._min.round ?? null])
    );

    const playedRoundByCompetition = new Map(
      playedRounds.map((row) => [row.competitionId, row._max.round ?? null])
    );

    const competitionsWithRounds = competitions.map((competition) => {
      const maxRound = maxRoundByCompetition.get(competition.id) ?? null;
      const currentRound =
        playedRoundByCompetition.get(competition.id) ??
        minRoundByCompetition.get(competition.id) ??
        null;

      return {
        code: competition.code,
        name: competition.name,
        season: competition.season,
        currentRound,
        maxRound,
      };
    });

    return {
      appName: 'Kazakh Football',
      season: 2026,
      competitions: competitionsWithRounds,
    };
  }
}
