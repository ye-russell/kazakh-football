import { computeStandings, MatchForStandings } from './standings.utils';

describe('computeStandings', () => {
  it('should compute standings with points calculation and correct sorting', () => {
    const matches: MatchForStandings[] = [
      // Team A vs Team B: 3-1 (A wins, 3 points)
      {
        homeTeam: { id: '1', name: 'Team A', shortName: 'A' },
        awayTeam: { id: '2', name: 'Team B', shortName: 'B' },
        homeScore: 3,
        awayScore: 1,
      },
      // Team B vs Team C: 2-2 (draw, 1 point each)
      {
        homeTeam: { id: '2', name: 'Team B', shortName: 'B' },
        awayTeam: { id: '3', name: 'Team C', shortName: 'C' },
        homeScore: 2,
        awayScore: 2,
      },
      // Team C vs Team A: 1-0 (C wins, 3 points)
      {
        homeTeam: { id: '3', name: 'Team C', shortName: 'C' },
        awayTeam: { id: '1', name: 'Team A', shortName: 'A' },
        homeScore: 1,
        awayScore: 0,
      },
      // Team A vs Team D: 4-0 (A wins, 3 points)
      {
        homeTeam: { id: '1', name: 'Team A', shortName: 'A' },
        awayTeam: { id: '4', name: 'Team D', shortName: 'D' },
        homeScore: 4,
        awayScore: 0,
      },
      // Team D vs Team B: 1-0 (D wins, 3 points)
      {
        homeTeam: { id: '4', name: 'Team D', shortName: 'D' },
        awayTeam: { id: '2', name: 'Team B', shortName: 'B' },
        homeScore: 1,
        awayScore: 0,
      },
      // Team C vs Team D: 2-1 (C wins, 3 points)
      {
        homeTeam: { id: '3', name: 'Team C', shortName: 'C' },
        awayTeam: { id: '4', name: 'Team D', shortName: 'D' },
        homeScore: 2,
        awayScore: 1,
      },
    ];

    const standings = computeStandings(matches);

    // Expected standings:
    // 1. Team C: 7 pts, +2 GD (2W 1D 0L, 5GF 3GA) - played 3
    // 2. Team A: 6 pts, +5 GD (2W 0D 1L, 7GF 2GA) - played 3
    // 3. Team D: 3 pts, -4 GD (1W 0D 2L, 2GF 6GA) - played 3
    // 4. Team B: 1 pt, -3 GD (0W 1D 2L, 3GF 6GA) - played 3

    expect(standings).toHaveLength(4);

    // Team C should be first (7 points)
    expect(standings[0].team.name).toBe('Team C');
    expect(standings[0].points).toBe(7);
    expect(standings[0].played).toBe(3);
    expect(standings[0].wins).toBe(2);
    expect(standings[0].draws).toBe(1);
    expect(standings[0].losses).toBe(0);
    expect(standings[0].goalsFor).toBe(5);
    expect(standings[0].goalsAgainst).toBe(3);
    expect(standings[0].goalDiff).toBe(2);

    // Team A should be second (6 points)
    expect(standings[1].team.name).toBe('Team A');
    expect(standings[1].points).toBe(6);
    expect(standings[1].played).toBe(3);
    expect(standings[1].wins).toBe(2);
    expect(standings[1].draws).toBe(0);
    expect(standings[1].losses).toBe(1);
    expect(standings[1].goalsFor).toBe(7);
    expect(standings[1].goalsAgainst).toBe(2);
    expect(standings[1].goalDiff).toBe(5);

    // Team D should be third
    expect(standings[2].team.name).toBe('Team D');
    expect(standings[2].points).toBe(3);
    expect(standings[2].played).toBe(3);
    expect(standings[2].wins).toBe(1);
    expect(standings[2].draws).toBe(0);
    expect(standings[2].losses).toBe(2);
    expect(standings[2].goalsFor).toBe(2);
    expect(standings[2].goalsAgainst).toBe(6);
    expect(standings[2].goalDiff).toBe(-4);

    // Team B should be last
    expect(standings[3].team.name).toBe('Team B');
    expect(standings[3].points).toBe(1);
    expect(standings[3].played).toBe(3);
    expect(standings[3].wins).toBe(0);
    expect(standings[3].draws).toBe(1);
    expect(standings[3].losses).toBe(2);
    expect(standings[3].goalsFor).toBe(3);
    expect(standings[3].goalsAgainst).toBe(6);
    expect(standings[3].goalDiff).toBe(-3);
  });

  it('should handle tie-break by goals for when points and goal diff are equal', () => {
    const matches: MatchForStandings[] = [
      // Team X: 2-0 win (3 pts, +2 GD, 2 GF)
      {
        homeTeam: { id: '1', name: 'Team X', shortName: 'X' },
        awayTeam: { id: '3', name: 'Team Z', shortName: 'Z' },
        homeScore: 2,
        awayScore: 0,
      },
      // Team Y: 3-1 win (3 pts, +2 GD, 3 GF)
      {
        homeTeam: { id: '2', name: 'Team Y', shortName: 'Y' },
        awayTeam: { id: '3', name: 'Team Z', shortName: 'Z' },
        homeScore: 3,
        awayScore: 1,
      },
    ];

    const standings = computeStandings(matches);

    // Team Y should be first (same points and goal diff, but more goals for)
    expect(standings[0].team.name).toBe('Team Y');
    expect(standings[0].points).toBe(3);
    expect(standings[0].goalDiff).toBe(2);
    expect(standings[0].goalsFor).toBe(3);

    // Team X should be second
    expect(standings[1].team.name).toBe('Team X');
    expect(standings[1].points).toBe(3);
    expect(standings[1].goalDiff).toBe(2);
    expect(standings[1].goalsFor).toBe(2);
  });

  it('should handle tie-break by name when all stats are equal', () => {
    const matches: MatchForStandings[] = [
      // Both teams win with same score
      {
        homeTeam: { id: '1', name: 'Zebras', shortName: 'Z' },
        awayTeam: { id: '3', name: 'Lions', shortName: 'L' },
        homeScore: 1,
        awayScore: 0,
      },
      {
        homeTeam: { id: '2', name: 'Tigers', shortName: 'T' },
        awayTeam: { id: '3', name: 'Lions', shortName: 'L' },
        homeScore: 1,
        awayScore: 0,
      },
    ];

    const standings = computeStandings(matches);

    // Tigers should come before Zebras (alphabetically)
    expect(standings[0].team.name).toBe('Tigers');
    expect(standings[1].team.name).toBe('Zebras');
    expect(standings[2].team.name).toBe('Lions');
  });

  it('should return empty array for no matches', () => {
    const standings = computeStandings([]);
    expect(standings).toEqual([]);
  });
});
