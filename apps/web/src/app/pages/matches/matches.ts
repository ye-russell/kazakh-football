import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatchesService } from '../../shared/services/matches.service';
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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly matches = signal<Match[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly currentRound = signal(1);

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const round = params['round'] ? parseInt(params['round'], 10) : 1;
      this.currentRound.set(round);
      this.loadMatches(round);
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
}

