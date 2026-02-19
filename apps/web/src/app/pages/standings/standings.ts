import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { StandingsService } from '../../shared/services/standings.service';
import { MatchesService } from '../../shared/services/matches.service';
import { Match, Standing } from '../../shared/interfaces/api.interfaces';

type TeamLastResult = 'W' | 'D' | 'L' | '—';
type StandingsMobileView = 'short' | 'full';

@Component({
  selector: 'app-standings',
  templateUrl: './standings.html',
  styleUrl: './standings.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslateModule, TranslatePipe],
})
export class Standings implements OnInit {
  private readonly standingsService = inject(StandingsService);
  private readonly matchesService = inject(MatchesService);

  protected readonly standings = signal<Standing[]>([]);
  protected readonly matches = signal<Match[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly mobileView = signal<StandingsMobileView>('short');

  // Computed standings with position (rank)
  protected readonly standingsWithPosition = computed(() => {
    const matches = this.matches();
    const lastRounds = this.getLastFinishedRounds(matches, 5);
    const positionChanges = this.getPositionChanges(this.standings(), matches);

    return this.standings().map((standing, index) => ({
      ...standing,
      position: index + 1,
      lastFive: this.getLastResultsForTeam(standing.team.id, matches, lastRounds),
      positionChange: positionChanges.get(standing.team.id) ?? null,
    }));
  });

  ngOnInit() {
    this.loadStandings();
  }

  protected setMobileView(view: StandingsMobileView) {
    this.mobileView.set(view);
  }

  private loadStandings() {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      standings: this.standingsService.getStandings(),
      matches: this.matchesService.getMatches(),
    }).subscribe({
      next: ({ standings, matches }) => {
        this.standings.set(standings);
        this.matches.set(matches);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Failed to load standings');
        this.loading.set(false);
        console.error('Error loading standings:', err);
      },
    });
  }

  private getLastFinishedRounds(matches: Match[], limit: number): number[] {
    const finishedRounds = matches
      .filter((match) => match.status === 'finished')
      .map((match) => match.round)
      .filter((round) => Number.isFinite(round));

    const uniqueRounds = Array.from(new Set(finishedRounds)).sort((a, b) => b - a);
    return uniqueRounds.slice(0, limit);
  }

  private getLastResultsForTeam(
    teamId: string,
    matches: Match[],
    rounds: number[]
  ): TeamLastResult[] {
    return rounds.map((round) => {
      const match = matches.find(
        (item) =>
          item.status === 'finished' &&
          item.round === round &&
          (item.homeTeam.id === teamId || item.awayTeam.id === teamId)
      );

      if (!match || match.homeScore == null || match.awayScore == null) {
        return '—';
      }

      const isHome = match.homeTeam.id === teamId;
      const teamScore = isHome ? match.homeScore : match.awayScore;
      const opponentScore = isHome ? match.awayScore : match.homeScore;

      if (teamScore > opponentScore) {
        return 'W';
      }

      if (teamScore < opponentScore) {
        return 'L';
      }

      return 'D';
    });
  }

  private getPositionChanges(
    standings: Standing[],
    matches: Match[]
  ): Map<string, number | null> {
    const finishedRounds = this.getLastFinishedRounds(matches, 2);
    if (finishedRounds.length < 2) {
      return new Map(standings.map((row) => [row.team.id, null]));
    }

    const lastRound = finishedRounds[0];
    const previousRound = finishedRounds[1];

    const currentPositions = this.getPositionsFromStandings(
      this.computeStandingsForRound(standings, matches, lastRound)
    );
    const previousPositions = this.getPositionsFromStandings(
      this.computeStandingsForRound(standings, matches, previousRound)
    );

    const changes = new Map<string, number | null>();
    standings.forEach((row) => {
      const current = currentPositions.get(row.team.id);
      const previous = previousPositions.get(row.team.id);
      if (current == null || previous == null) {
        changes.set(row.team.id, null);
      } else {
        changes.set(row.team.id, previous - current);
      }
    });

    return changes;
  }

  private computeStandingsForRound(
    standings: Standing[],
    matches: Match[],
    maxRound: number
  ): Standing[] {
    const statsByTeam = new Map<string, Standing>();

    standings.forEach((row) => {
      statsByTeam.set(row.team.id, {
        team: row.team,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiff: 0,
        points: 0,
      });
    });

    matches.forEach((match) => {
      if (match.status !== 'finished' || match.round > maxRound) {
        return;
      }

      if (match.homeScore == null || match.awayScore == null) {
        return;
      }

      const home = this.getOrCreateStats(statsByTeam, match.homeTeam);
      const away = this.getOrCreateStats(statsByTeam, match.awayTeam);

      home.played += 1;
      away.played += 1;

      home.goalsFor += match.homeScore;
      home.goalsAgainst += match.awayScore;
      away.goalsFor += match.awayScore;
      away.goalsAgainst += match.homeScore;

      if (match.homeScore > match.awayScore) {
        home.wins += 1;
        away.losses += 1;
      } else if (match.homeScore < match.awayScore) {
        away.wins += 1;
        home.losses += 1;
      } else {
        home.draws += 1;
        away.draws += 1;
      }
    });

    const rows = Array.from(statsByTeam.values()).map((row) => ({
      ...row,
      goalDiff: row.goalsFor - row.goalsAgainst,
      points: row.wins * 3 + row.draws,
    }));

    return rows.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }

      if (b.goalDiff !== a.goalDiff) {
        return b.goalDiff - a.goalDiff;
      }

      if (b.goalsFor !== a.goalsFor) {
        return b.goalsFor - a.goalsFor;
      }

      return a.team.name.localeCompare(b.team.name);
    });
  }

  private getPositionsFromStandings(rows: Standing[]): Map<string, number> {
    const positions = new Map<string, number>();
    rows.forEach((row, index) => {
      positions.set(row.team.id, index + 1);
    });
    return positions;
  }

  private getOrCreateStats(
    stats: Map<string, Standing>,
    team: Match['homeTeam']
  ): Standing {
    const existing = stats.get(team.id);
    if (existing) {
      return existing;
    }

    const row: Standing = {
      team,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0,
    };

    stats.set(team.id, row);
    return row;
  }
}
