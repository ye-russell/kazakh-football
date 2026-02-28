import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Scoring rules:
 * - Playing 1-59 min:     +1
 * - Playing 60+ min:      +2
 * - Goal (FW):            +4
 * - Goal (MF):            +5
 * - Goal (DF/GK):         +6
 * - Assist:               +3
 * - Clean sheet (DF/GK):  +4
 * - Clean sheet (MF):     +1
 * - Yellow card:          -1
 * - Red card:             -3
 * - Captain:              2× points
 */

interface PlayerPoints {
  playerId: string;
  points: number;
  breakdown: Record<string, number>;
}

const GOAL_POINTS: Record<string, number> = {
  FW: 4,
  MF: 5,
  DF: 6,
  GK: 6,
};

@Injectable()
export class ScoringService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate fantasy points for a given gameweek (round) and competition.
   * Then update FantasyGameweek and FantasyTeam.totalPoints for all teams.
   */
  async calculateGameweek(competitionCode: string, round: number) {
    const competition = await this.prisma.competition.findUnique({
      where: { code: competitionCode },
    });

    if (!competition) return;

    // Get all finished matches for this round
    const matches = await this.prisma.match.findMany({
      where: {
        competitionId: competition.id,
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
          select: {
            playerId: true,
            assistPlayerId: true,
            type: true,
          },
        },
        lineups: {
          select: {
            playerId: true,
            teamId: true,
            isStarter: true,
            position: true,
            player: {
              select: { position: true },
            },
          },
        },
      },
    });

    if (matches.length === 0) return;

    // Calculate points per player
    const playerPointsMap = new Map<string, PlayerPoints>();

    const getOrCreate = (playerId: string): PlayerPoints => {
      if (!playerPointsMap.has(playerId)) {
        playerPointsMap.set(playerId, { playerId, points: 0, breakdown: {} });
      }
      return playerPointsMap.get(playerId)!;
    };

    for (const match of matches) {
      // Determine clean sheets
      const homeCleanSheet = match.awayScore === 0;
      const awayCleanSheet = match.homeScore === 0;

      for (const lineup of match.lineups) {
        const pp = getOrCreate(lineup.playerId);
        const position = lineup.position || lineup.player.position || 'MF';

        // Appearance points (simplified: starters get 2, subs get 1)
        if (lineup.isStarter) {
          pp.points += 2;
          pp.breakdown['appearance'] = (pp.breakdown['appearance'] || 0) + 2;
        } else {
          // Check if they were subbed in (appeared)
          const wasSubbedIn = match.events.some(
            (e) => e.type === 'substitution' && e.playerId === lineup.playerId,
          );
          if (wasSubbedIn) {
            pp.points += 1;
            pp.breakdown['appearance'] = (pp.breakdown['appearance'] || 0) + 1;
          }
        }

        // Clean sheet
        const isHomeTeam = lineup.teamId === match.homeTeamId;
        const cleanSheet = isHomeTeam ? homeCleanSheet : awayCleanSheet;

        if (cleanSheet && lineup.isStarter) {
          if (position === 'GK' || position === 'DF') {
            pp.points += 4;
            pp.breakdown['cleanSheet'] = (pp.breakdown['cleanSheet'] || 0) + 4;
          } else if (position === 'MF') {
            pp.points += 1;
            pp.breakdown['cleanSheet'] = (pp.breakdown['cleanSheet'] || 0) + 1;
          }
        }
      }

      // Process events
      for (const event of match.events) {
        if (event.type === 'goal') {
          const pp = getOrCreate(event.playerId);
          // Look up player position from lineup
          const lineup = match.lineups.find(
            (l) => l.playerId === event.playerId,
          );
          const position =
            lineup?.position || lineup?.player.position || 'MF';
          const goalPts = GOAL_POINTS[position] || 4;
          pp.points += goalPts;
          pp.breakdown['goals'] = (pp.breakdown['goals'] || 0) + goalPts;

          // Assist
          if (event.assistPlayerId) {
            const ap = getOrCreate(event.assistPlayerId);
            ap.points += 3;
            ap.breakdown['assists'] = (ap.breakdown['assists'] || 0) + 3;
          }
        }

        if (event.type === 'yellow_card') {
          const pp = getOrCreate(event.playerId);
          pp.points -= 1;
          pp.breakdown['yellowCards'] =
            (pp.breakdown['yellowCards'] || 0) - 1;
        }

        if (event.type === 'red_card') {
          const pp = getOrCreate(event.playerId);
          pp.points -= 3;
          pp.breakdown['redCards'] = (pp.breakdown['redCards'] || 0) - 3;
        }
      }
    }

    // Now update all fantasy teams with their picks
    const fantasyTeams = await this.prisma.fantasyTeam.findMany({
      where: { competitionId: competition.id },
      select: {
        id: true,
        picks: {
          select: {
            playerId: true,
            isCaptain: true,
            isViceCaptain: true,
          },
        },
      },
    });

    for (const fTeam of fantasyTeams) {
      let gameweekPoints = 0;

      // Check if captain played (has points entry in the map)
      const captainPick = fTeam.picks.find((p) => p.isCaptain);
      const viceCaptainPick = fTeam.picks.find((p) => p.isViceCaptain);
      const captainPlayed =
        captainPick && playerPointsMap.has(captainPick.playerId) &&
        (playerPointsMap.get(captainPick.playerId)!.breakdown['appearance'] ?? 0) > 0;

      for (const pick of fTeam.picks) {
        const pp = playerPointsMap.get(pick.playerId);
        if (!pp) continue;

        let pts = pp.points;

        // Captain gets 2× points; if captain didn't play, vice-captain gets 2×
        if (pick.isCaptain && captainPlayed) {
          pts *= 2;
        } else if (
          pick.isViceCaptain &&
          !captainPlayed &&
          viceCaptainPick
        ) {
          pts *= 2;
        }

        gameweekPoints += pts;
      }

      // Upsert gameweek points
      await this.prisma.fantasyGameweek.upsert({
        where: {
          fantasyTeamId_round: {
            fantasyTeamId: fTeam.id,
            round,
          },
        },
        update: { points: gameweekPoints },
        create: {
          fantasyTeamId: fTeam.id,
          round,
          points: gameweekPoints,
        },
      });
    }

    // Recalculate total points for all teams
    for (const fTeam of fantasyTeams) {
      const gameweeks = await this.prisma.fantasyGameweek.findMany({
        where: { fantasyTeamId: fTeam.id },
        select: { points: true },
      });

      const total = gameweeks.reduce((sum, gw) => sum + gw.points, 0);

      await this.prisma.fantasyTeam.update({
        where: { id: fTeam.id },
        data: { totalPoints: total },
      });
    }

    return {
      round,
      matchesProcessed: matches.length,
      teamsUpdated: fantasyTeams.length,
    };
  }
}
