import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFantasyTeamDto } from './dto/create-fantasy-team.dto';
import { UpdatePicksDto } from './dto/update-picks.dto';

// Squad rules
const SQUAD_SIZE = 15;
const POSITION_LIMITS: Record<string, number> = { GK: 2, DF: 5, MF: 5, FW: 3 };
const MAX_PLAYERS_PER_TEAM = 3;
const STARTING_BUDGET = 100.0;

const GOAL_POINTS: Record<string, number> = { FW: 4, MF: 5, DF: 6, GK: 6 };

@Injectable()
export class FantasyService {
  constructor(private readonly prisma: PrismaService) {}

  async createTeam(userId: string, dto: CreateFantasyTeamDto) {
    const competition = await this.prisma.competition.findUnique({
      where: { code: dto.competition ?? 'kpl' },
    });

    if (!competition) {
      throw new NotFoundException('Competition not found');
    }

    // Check if user already has a team for this competition
    const existing = await this.prisma.fantasyTeam.findUnique({
      where: {
        userId_competitionId: {
          userId,
          competitionId: competition.id,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        'You already have a fantasy team for this competition',
      );
    }

    return this.prisma.fantasyTeam.create({
      data: {
        userId,
        competitionId: competition.id,
        name: dto.name,
        budget: STARTING_BUDGET,
      },
      select: {
        id: true,
        name: true,
        budget: true,
        totalPoints: true,
        competition: { select: { code: true, name: true, season: true } },
      },
    });
  }

  async getMyTeam(userId: string, competition = 'kpl') {
    const comp = await this.prisma.competition.findUnique({
      where: { code: competition },
    });

    if (!comp) {
      throw new NotFoundException('Competition not found');
    }

    const team = await this.prisma.fantasyTeam.findUnique({
      where: {
        userId_competitionId: {
          userId,
          competitionId: comp.id,
        },
      },
      select: {
        id: true,
        name: true,
        budget: true,
        totalPoints: true,
        competition: { select: { code: true, name: true, season: true } },
        picks: {
          select: {
            id: true,
            isCaptain: true,
            isViceCaptain: true,
            position: true,
            player: {
              select: {
                id: true,
                name: true,
                number: true,
                position: true,
                price: true,
                team: { select: { id: true, name: true, shortName: true } },
              },
            },
          },
          orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!team) {
      return null;
    }

    return team;
  }

  async getTeamById(teamId: string) {
    const team = await this.prisma.fantasyTeam.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        name: true,
        budget: true,
        totalPoints: true,
        user: { select: { id: true, displayName: true } },
        competition: { select: { code: true, name: true, season: true } },
        picks: {
          select: {
            id: true,
            isCaptain: true,
            isViceCaptain: true,
            position: true,
            player: {
              select: {
                id: true,
                name: true,
                number: true,
                position: true,
                price: true,
                team: { select: { id: true, name: true, shortName: true } },
              },
            },
          },
          orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!team) {
      throw new NotFoundException('Fantasy team not found');
    }

    return team;
  }

  async updatePicks(userId: string, teamId: string, dto: UpdatePicksDto) {
    // Verify ownership
    const team = await this.prisma.fantasyTeam.findUnique({
      where: { id: teamId },
      select: { id: true, userId: true, competitionId: true },
    });

    if (!team) {
      throw new NotFoundException('Fantasy team not found');
    }

    if (team.userId !== userId) {
      throw new ForbiddenException('This is not your team');
    }

    // ── Squad lock: block changes while a round is in progress ──
    const liveOrPlayedMatch = await this.prisma.match.findFirst({
      where: {
        competitionId: team.competitionId,
        status: 'live',
      },
    });

    if (liveOrPlayedMatch) {
      throw new BadRequestException(
        'Squad changes are locked while matches are in progress',
      );
    }

    // Validate picks
    if (dto.picks.length !== SQUAD_SIZE) {
      throw new BadRequestException(
        `Squad must have exactly ${SQUAD_SIZE} players`,
      );
    }

    // Load player data
    const playerIds = dto.picks.map((p) => p.playerId);
    const uniqueIds = new Set(playerIds);
    if (uniqueIds.size !== playerIds.length) {
      throw new BadRequestException('Duplicate players in squad');
    }

    const players = await this.prisma.player.findMany({
      where: { id: { in: playerIds } },
      select: { id: true, price: true, teamId: true, position: true },
    });

    if (players.length !== SQUAD_SIZE) {
      throw new BadRequestException('One or more players not found');
    }

    const playerMap = new Map(players.map((p) => [p.id, p]));

    // Validate position limits
    const positionCounts: Record<string, number> = { GK: 0, DF: 0, MF: 0, FW: 0 };
    for (const pick of dto.picks) {
      positionCounts[pick.position] = (positionCounts[pick.position] || 0) + 1;
    }

    for (const [pos, limit] of Object.entries(POSITION_LIMITS)) {
      if ((positionCounts[pos] || 0) !== limit) {
        throw new BadRequestException(
          `Must have exactly ${limit} ${pos} players (got ${positionCounts[pos] || 0})`,
        );
      }
    }

    // Validate max players per team
    const teamCounts = new Map<string, number>();
    for (const pick of dto.picks) {
      const player = playerMap.get(pick.playerId)!;
      const count = (teamCounts.get(player.teamId) || 0) + 1;
      if (count > MAX_PLAYERS_PER_TEAM) {
        throw new BadRequestException(
          `Maximum ${MAX_PLAYERS_PER_TEAM} players from the same team`,
        );
      }
      teamCounts.set(player.teamId, count);
    }

    // Validate budget
    const totalCost = dto.picks.reduce((sum, pick) => {
      const player = playerMap.get(pick.playerId)!;
      return sum + player.price;
    }, 0);

    if (totalCost > STARTING_BUDGET) {
      throw new BadRequestException(
        `Squad cost (${totalCost.toFixed(1)}) exceeds budget (${STARTING_BUDGET})`,
      );
    }

    // Validate captain & vice-captain
    const captains = dto.picks.filter((p) => p.isCaptain);
    const viceCaptains = dto.picks.filter((p) => p.isViceCaptain);

    if (captains.length !== 1) {
      throw new BadRequestException('Must select exactly one captain');
    }
    if (viceCaptains.length !== 1) {
      throw new BadRequestException('Must select exactly one vice-captain');
    }
    if (captains[0].playerId === viceCaptains[0].playerId) {
      throw new BadRequestException(
        'Captain and vice-captain must be different players',
      );
    }

    // All validations passed — replace picks in a transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.fantasyPick.deleteMany({ where: { fantasyTeamId: teamId } });

      await tx.fantasyPick.createMany({
        data: dto.picks.map((pick) => ({
          fantasyTeamId: teamId,
          playerId: pick.playerId,
          position: pick.position,
          isCaptain: pick.isCaptain ?? false,
          isViceCaptain: pick.isViceCaptain ?? false,
        })),
      });

      await tx.fantasyTeam.update({
        where: { id: teamId },
        data: { budget: STARTING_BUDGET - totalCost },
      });
    });

    return this.getMyTeam(userId, 'kpl');
  }

  async getLeaderboard(competition = 'kpl') {
    const comp = await this.prisma.competition.findUnique({
      where: { code: competition },
    });

    if (!comp) {
      throw new NotFoundException('Competition not found');
    }

    return this.prisma.fantasyTeam.findMany({
      where: { competitionId: comp.id },
      select: {
        id: true,
        name: true,
        totalPoints: true,
        user: { select: { id: true, displayName: true } },
      },
      orderBy: { totalPoints: 'desc' },
      take: 100,
    });
  }

  async getGameweekPoints(teamId: string) {
    const team = await this.prisma.fantasyTeam.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundException('Fantasy team not found');
    }

    return this.prisma.fantasyGameweek.findMany({
      where: { fantasyTeamId: teamId },
      orderBy: { round: 'asc' },
      select: {
        round: true,
        points: true,
      },
    });
  }

  async getAvailablePlayers(competition = 'kpl') {
    const comp = await this.prisma.competition.findUnique({
      where: { code: competition },
    });

    if (!comp) {
      throw new NotFoundException('Competition not found');
    }

    // Get all players from teams that participate in this competition
    const teamIds = await this.prisma.match
      .findMany({
        where: { competitionId: comp.id },
        select: { homeTeamId: true, awayTeamId: true },
      })
      .then((matches) => {
        const ids = new Set<string>();
        for (const m of matches) {
          ids.add(m.homeTeamId);
          ids.add(m.awayTeamId);
        }
        return Array.from(ids);
      });

    return this.prisma.player.findMany({
      where: { teamId: { in: teamIds } },
      select: {
        id: true,
        name: true,
        number: true,
        position: true,
        price: true,
        team: { select: { id: true, name: true, shortName: true } },
      },
      orderBy: [{ price: 'desc' }, { name: 'asc' }],
    });
  }

  /**
   * Compute per-player point breakdown for a fantasy team in a specific round.
   * This recomputes from match data (no extra DB table needed).
   */
  async getGameweekPlayerBreakdown(teamId: string, round: number) {
    const team = await this.prisma.fantasyTeam.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        competitionId: true,
        picks: {
          select: {
            playerId: true,
            position: true,
            isCaptain: true,
            isViceCaptain: true,
            player: {
              select: {
                id: true,
                name: true,
                position: true,
                team: { select: { id: true, shortName: true } },
              },
            },
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException('Fantasy team not found');
    }

    // Get matches for this round
    const matches = await this.prisma.match.findMany({
      where: {
        competitionId: team.competitionId,
        round,
        status: 'finished',
      },
      select: {
        id: true,
        homeTeamId: true,
        awayTeamId: true,
        homeScore: true,
        awayScore: true,
        events: {
          select: { playerId: true, assistPlayerId: true, type: true },
        },
        lineups: {
          select: {
            playerId: true,
            teamId: true,
            isStarter: true,
            position: true,
            player: { select: { position: true } },
          },
        },
      },
    });

    // Build per-player point map (same logic as ScoringService)
    const pointsMap = new Map<
      string,
      { points: number; breakdown: Record<string, number> }
    >();

    const getOrCreate = (playerId: string) => {
      if (!pointsMap.has(playerId)) {
        pointsMap.set(playerId, { points: 0, breakdown: {} });
      }
      return pointsMap.get(playerId)!;
    };

    for (const match of matches) {
      const homeClean = match.awayScore === 0;
      const awayClean = match.homeScore === 0;

      for (const lineup of match.lineups) {
        const pp = getOrCreate(lineup.playerId);
        const pos = lineup.position || lineup.player.position || 'MF';

        if (lineup.isStarter) {
          pp.points += 2;
          pp.breakdown['appearance'] = (pp.breakdown['appearance'] || 0) + 2;
        } else {
          const wasSubbedIn = match.events.some(
            (e) => e.type === 'substitution' && e.playerId === lineup.playerId,
          );
          if (wasSubbedIn) {
            pp.points += 1;
            pp.breakdown['appearance'] = (pp.breakdown['appearance'] || 0) + 1;
          }
        }

        const isHome = lineup.teamId === match.homeTeamId;
        const cleanSheet = isHome ? homeClean : awayClean;
        if (cleanSheet && lineup.isStarter) {
          if (pos === 'GK' || pos === 'DF') {
            pp.points += 4;
            pp.breakdown['cleanSheet'] = (pp.breakdown['cleanSheet'] || 0) + 4;
          } else if (pos === 'MF') {
            pp.points += 1;
            pp.breakdown['cleanSheet'] = (pp.breakdown['cleanSheet'] || 0) + 1;
          }
        }
      }

      for (const event of match.events) {
        if (event.type === 'goal') {
          const pp = getOrCreate(event.playerId);
          const lineup = match.lineups.find(
            (l) => l.playerId === event.playerId,
          );
          const pos = lineup?.position || lineup?.player.position || 'MF';
          const goalPts = GOAL_POINTS[pos] || 4;
          pp.points += goalPts;
          pp.breakdown['goals'] = (pp.breakdown['goals'] || 0) + goalPts;

          if (event.assistPlayerId) {
            const ap = getOrCreate(event.assistPlayerId);
            ap.points += 3;
            ap.breakdown['assists'] = (ap.breakdown['assists'] || 0) + 3;
          }
        }
        if (event.type === 'yellow_card') {
          const pp = getOrCreate(event.playerId);
          pp.points -= 1;
          pp.breakdown['yellowCards'] = (pp.breakdown['yellowCards'] || 0) - 1;
        }
        if (event.type === 'red_card') {
          const pp = getOrCreate(event.playerId);
          pp.points -= 3;
          pp.breakdown['redCards'] = (pp.breakdown['redCards'] || 0) - 3;
        }
      }
    }

    // Check captain/VC promotion
    const captainPick = team.picks.find((p) => p.isCaptain);
    const captainPlayed =
      captainPick &&
      pointsMap.has(captainPick.playerId) &&
      (pointsMap.get(captainPick.playerId)!.breakdown['appearance'] ?? 0) > 0;

    // Build result
    const players = team.picks.map((pick) => {
      const pp = pointsMap.get(pick.playerId);
      let rawPoints = pp?.points ?? 0;
      let multiplier = 1;

      if (pick.isCaptain && captainPlayed) {
        multiplier = 2;
      } else if (pick.isViceCaptain && !captainPlayed) {
        multiplier = 2;
      }

      return {
        playerId: pick.playerId,
        playerName: pick.player.name,
        position: pick.position,
        teamShortName: pick.player.team.shortName,
        isCaptain: pick.isCaptain,
        isViceCaptain: pick.isViceCaptain,
        rawPoints,
        multiplier,
        totalPoints: rawPoints * multiplier,
        breakdown: pp?.breakdown ?? {},
      };
    });

    const gameweekTotal = players.reduce((s, p) => s + p.totalPoints, 0);

    return { round, gameweekTotal, players };
  }
}
