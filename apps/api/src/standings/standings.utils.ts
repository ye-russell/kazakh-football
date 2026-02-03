export interface TeamBasic {
  id: string;
  name: string;
  shortName: string;
}

export interface MatchForStandings {
  homeTeam: TeamBasic;
  awayTeam: TeamBasic;
  homeScore: number;
  awayScore: number;
}

export interface StandingsRow {
  team: TeamBasic;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

interface TeamStats {
  team: TeamBasic;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

export function computeStandings(
  matches: MatchForStandings[],
  allTeams: TeamBasic[] = [],
): StandingsRow[] {
  const teamStatsMap = new Map<string, TeamStats>();

  // Initialize all teams with 0s
  for (const team of allTeams) {
    teamStatsMap.set(team.id, {
      team,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    });
  }

  // Initialize or get team stats
  const getTeamStats = (team: TeamBasic): TeamStats => {
    if (!teamStatsMap.has(team.id)) {
      teamStatsMap.set(team.id, {
        team,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
      });
    }
    return teamStatsMap.get(team.id)!;
  };

  // Process each match
  for (const match of matches) {
    const homeStats = getTeamStats(match.homeTeam);
    const awayStats = getTeamStats(match.awayTeam);

    homeStats.played++;
    awayStats.played++;

    homeStats.goalsFor += match.homeScore;
    homeStats.goalsAgainst += match.awayScore;
    awayStats.goalsFor += match.awayScore;
    awayStats.goalsAgainst += match.homeScore;

    if (match.homeScore > match.awayScore) {
      // Home win
      homeStats.wins++;
      awayStats.losses++;
    } else if (match.homeScore < match.awayScore) {
      // Away win
      awayStats.wins++;
      homeStats.losses++;
    } else {
      // Draw
      homeStats.draws++;
      awayStats.draws++;
    }
  }

  // Convert to standings rows with points and goal difference
  const standings: StandingsRow[] = Array.from(teamStatsMap.values()).map(
    (stats) => ({
      team: stats.team,
      played: stats.played,
      wins: stats.wins,
      draws: stats.draws,
      losses: stats.losses,
      goalsFor: stats.goalsFor,
      goalsAgainst: stats.goalsAgainst,
      goalDiff: stats.goalsFor - stats.goalsAgainst,
      points: stats.wins * 3 + stats.draws,
    }),
  );

  // Sort by: points desc, goalDiff desc, goalsFor desc, team name asc
  standings.sort((a, b) => {
    if (a.points !== b.points) {
      return b.points - a.points;
    }
    if (a.goalDiff !== b.goalDiff) {
      return b.goalDiff - a.goalDiff;
    }
    if (a.goalsFor !== b.goalsFor) {
      return b.goalsFor - a.goalsFor;
    }
    return a.team.name.localeCompare(b.team.name);
  });

  return standings;
}
