import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetStatsDto } from './dto/get-stats.dto';

export interface PlayerStat {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  teamShortName: string;
  count: number;
}

export interface LeagueStats {
  competition: string;
  season: number;
  topScorers: PlayerStat[];
  topAssists: PlayerStat[];
  mostYellowCards: PlayerStat[];
  mostRedCards: PlayerStat[];
  cleanSheets: PlayerStat[];
}

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(query: GetStatsDto): Promise<LeagueStats> {
    const competition = await this.prisma.competition.findUnique({
      where: { code: query.competition },
    });

    if (!competition) {
      throw new NotFoundException(
        `Competition with code '${query.competition}' not found`,
      );
    }

    const [topScorers, topAssists, mostYellowCards, mostRedCards, cleanSheets] =
      await Promise.all([
        this.getTopScorers(competition.id),
        this.getTopAssists(competition.id),
        this.getMostCards(competition.id, 'yellow_card'),
        this.getMostCards(competition.id, 'red_card'),
        this.getCleanSheets(competition.id),
      ]);

    return {
      competition: competition.code,
      season: competition.season,
      topScorers,
      topAssists,
      mostYellowCards,
      mostRedCards,
      cleanSheets,
    };
  }

  private async getTopScorers(competitionId: string): Promise<PlayerStat[]> {
    const groups = await this.prisma.matchEvent.groupBy({
      by: ['playerId'],
      where: {
        match: { competitionId, status: 'finished' },
        type: 'goal',
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    });

    return this.resolvePlayerStats(groups, 'playerId');
  }

  private async getTopAssists(competitionId: string): Promise<PlayerStat[]> {
    const groups = await this.prisma.matchEvent.groupBy({
      by: ['assistPlayerId'],
      where: {
        match: { competitionId, status: 'finished' },
        type: 'goal',
        assistPlayerId: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    });

    const filtered = groups.filter((g) => g.assistPlayerId !== null) as Array<{
      assistPlayerId: string;
      _count: { id: number };
    }>;

    return this.resolvePlayerStats(
      filtered.map((g) => ({ playerId: g.assistPlayerId, _count: g._count })),
      'playerId',
    );
  }

  private async getMostCards(
    competitionId: string,
    type: 'yellow_card' | 'red_card',
  ): Promise<PlayerStat[]> {
    const groups = await this.prisma.matchEvent.groupBy({
      by: ['playerId'],
      where: {
        match: { competitionId, status: 'finished' },
        type,
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    });

    return this.resolvePlayerStats(groups, 'playerId');
  }

  private async getCleanSheets(competitionId: string): Promise<PlayerStat[]> {
    // Fetch finished matches with their starting GK lineups in one query
    const matches = await this.prisma.match.findMany({
      where: {
        competitionId,
        status: 'finished',
        homeScore: { not: null },
        awayScore: { not: null },
      },
      select: {
        homeTeamId: true,
        awayTeamId: true,
        homeScore: true,
        awayScore: true,
        lineups: {
          where: {
            OR: [
              { position: 'GK' },
              { player: { position: 'GK' } },
            ],
          },
          select: {
            teamId: true,
            player: {
              select: {
                id: true,
                name: true,
                team: { select: { id: true, name: true, shortName: true } },
              },
            },
          },
        },
      },
    });

    const counts = new Map<
      string,
      { playerId: string; playerName: string; teamId: string; teamName: string; teamShortName: string; count: number }
    >();

    for (const match of matches) {
      const cleanSheetTeamIds: string[] = [];
      if (match.awayScore === 0) cleanSheetTeamIds.push(match.homeTeamId);
      if (match.homeScore === 0) cleanSheetTeamIds.push(match.awayTeamId);

      for (const teamId of cleanSheetTeamIds) {
        const gkLineup = match.lineups.find((l) => l.teamId === teamId);
        if (!gkLineup) continue;

        const { player } = gkLineup;
        const existing = counts.get(player.id);
        if (existing) {
          existing.count += 1;
        } else {
          counts.set(player.id, {
            playerId: player.id,
            playerName: player.name,
            teamId: player.team.id,
            teamName: player.team.name,
            teamShortName: player.team.shortName,
            count: 1,
          });
        }
      }
    }

    return Array.from(counts.values()).sort((a, b) => b.count - a.count);
  }

  private async resolvePlayerStats(
    groups: Array<{ playerId: string; _count: { id: number } }>,
    _field: string,
  ): Promise<PlayerStat[]> {
    if (groups.length === 0) return [];

    const playerIds = groups.map((g) => g.playerId);
    const players = await this.prisma.player.findMany({
      where: { id: { in: playerIds } },
      include: {
        team: { select: { id: true, name: true, shortName: true } },
      },
    });

    const playerMap = new Map(players.map((p) => [p.id, p]));

    return groups
      .map((g) => {
        const player = playerMap.get(g.playerId);
        if (!player) return null;
        return {
          playerId: player.id,
          playerName: player.name,
          teamId: player.team.id,
          teamName: player.team.name,
          teamShortName: player.team.shortName,
          count: g._count.id,
        };
      })
      .filter((item): item is PlayerStat => item !== null);
  }
}
