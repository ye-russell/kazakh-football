import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatchesService } from '../../shared/services/matches.service';
import { LeagueService } from '../../shared/services/league.service';
import { MatchweekSelector } from '../../shared/components/matchweek-selector/matchweek-selector';
import { MatchesList } from '../../shared/components/matches-list/matches-list';
import { Match } from '../../shared/interfaces/api.interfaces';

@Component({
  selector: 'app-matches',
  templateUrl: './matches.html',
  styleUrl: './matches.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatchweekSelector, MatchesList],
})
export class Matches implements OnInit {
  private readonly matchesService = inject(MatchesService);
  private readonly leagueService = inject(LeagueService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly matches = signal<Match[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly currentRound = signal(1);
  protected readonly maxRound = signal<number | null>(null);
  private readonly requestedRound = signal<number | null>(null);

  ngOnInit() {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const roundParam = params['round'] ? parseInt(params['round'], 10) : null;
      this.requestedRound.set(roundParam);
      this.loadLeague();
    });
  }

  private loadLeague() {
    this.leagueService.getLeague().subscribe({
      next: (data) => {
        const competition = data.competitions.find((item) => item.code === 'kpl');
        this.maxRound.set(competition?.maxRound ?? null);

        const fallbackRound = competition?.currentRound ?? 1;
        const requested = this.requestedRound();
        const targetRound = this.clampRound(requested ?? fallbackRound);
        
        this.currentRound.set(targetRound);
        this.loadMatches(targetRound);
      },
      error: () => {
        const requested = this.requestedRound();
        const targetRound = requested ?? 1;
        this.currentRound.set(targetRound);
        this.loadMatches(targetRound);
      },
    });
  }

  private loadMatches(round: number) {
    this.loading.set(true);
    this.error.set(null);

    this.matchesService.getMatches(round).subscribe({
      next: (data) => {
        this.matches.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Failed to load matches');
        this.loading.set(false);
        console.error('Error loading matches:', err);
      },
    });
  }

  onRoundChanged(round: number) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { round },
      queryParamsHandling: 'merge',
    });
  }

  private clampRound(round: number) {
    const maxRound = this.maxRound();
    if (!maxRound) {
      return round;
    }
    return Math.min(round, maxRound);
  }
}

