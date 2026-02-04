/**
 * Team basic information
 * Used in matches and standings responses
 */
export interface TeamBasic {
  id: string;
  name: string;
  shortName: string;
}

/**
 * Full team information
 * Returned from GET /teams and GET /teams/:id
 */
export interface Team extends TeamBasic {
  city?: string;
  logoUrl?: string;
}

/**
 * Competition information
 * Part of GET /league response
 */
export interface Competition {
  code: string;
  name: string;
  season: number;
}

/**
 * League response from GET /league
 */
export interface LeagueInfo {
  appName: string;
  season: number;
  competitions: Competition[];
}

/**
 * Match response from GET /matches and GET /matches/:id
 */
export interface Match {
  id: string;
  competitionId?: string;
  round: number;
  kickoffAt: string;
  status: 'scheduled' | 'live' | 'finished';
  competition?: {
    code: string;
  };
  homeTeam: TeamBasic;
  awayTeam: TeamBasic;
  homeScore?: number | null;
  awayScore?: number | null;
}

/**
 * Standing row from GET /standings
 * Computed by backend from finished matches
 */
export interface Standing {
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
