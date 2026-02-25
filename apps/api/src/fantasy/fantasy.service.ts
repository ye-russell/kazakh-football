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
    });

    if (!team) {
      throw new NotFoundException('Fantasy team not found');
    }

    if (team.userId !== userId) {
      throw new ForbiddenException('This is not your team');
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
}
