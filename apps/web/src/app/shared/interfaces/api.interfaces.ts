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
  currentRound?: number | null;
  maxRound?: number | null;
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
  events?: MatchEvent[];
  lineups?: MatchLineup[];
}

export type MatchEventType = 'goal' | 'yellow_card' | 'red_card' | 'substitution';

export interface MatchEvent {
  id: string;
  minute: number;
  extraMinute?: number | null;
  type: MatchEventType;
  player: {
    id: string;
    name: string;
    number?: number | null;
  };
  assistPlayer?: {
    id: string;
    name: string;
    number?: number | null;
  } | null;
  subInPlayer?: {
    id: string;
    name: string;
    number?: number | null;
  } | null;
  subOutPlayer?: {
    id: string;
    name: string;
    number?: number | null;
  } | null;
  team: TeamBasic;
}

export interface MatchLineup {
  id: string;
  isStarter: boolean;
  position?: string | null;
  team: TeamBasic;
  player: {
    id: string;
    name: string;
    number?: number | null;
  };
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

/**
 * Individual player statistic entry (scorer, assist, card)
 * Part of LeagueStats response
 */
export interface PlayerStat {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  teamShortName: string;
  count: number;
}

/**
 * Full league statistics from GET /stats
 */
export interface LeagueStats {
  competition: string;
  season: number;
  topScorers: PlayerStat[];
  topAssists: PlayerStat[];
  mostYellowCards: PlayerStat[];
  mostRedCards: PlayerStat[];
  cleanSheets: PlayerStat[];
}
