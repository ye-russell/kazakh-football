import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatchesService } from '../../shared/services/matches.service';
import { Match } from '../../shared/interfaces/api.interfaces';

@Component({
  selector: 'app-match-detail',
  templateUrl: './match-detail.html',
  styleUrl: './match-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
})
export class MatchDetail implements OnInit {
  private readonly matchesService = inject(MatchesService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly match = signal<Match | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly roundQueryParam = signal<number | null>(null);

  protected readonly kickoffDate = computed(() => {
    const match = this.match();
    return match ? this.formatKickoffDate(match.kickoffAt) : '';
  });

  protected readonly kickoffTime = computed(() => {
    const match = this.match();
    return match ? this.formatKickoffTime(match.kickoffAt) : '';
  });

  protected readonly scoreDisplay = computed(() => {
    const match = this.match();
    if (!match) {
      return '-';
    }
    if (match.homeScore === null || match.awayScore === null) {
      return '-';
    }
    return `${match.homeScore} - ${match.awayScore}`;
  });

  ngOnInit() {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const round = params['round'] ? parseInt(params['round'], 10) : null;
      this.roundQueryParam.set(round);
    });

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const matchId = params.get('id');
      if (matchId) {
        this.loadMatch(matchId);
      }
    });
  }

  private loadMatch(matchId: string) {
    this.loading.set(true);
    this.error.set(null);

    this.matchesService.getMatchById(matchId).subscribe({
      next: (data) => {
        this.match.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Failed to load match details');
        this.loading.set(false);
        console.error('Error loading match detail:', err);
      },
    });
  }

  getStatusLabel(status: Match['status']): string {
    switch (status) {
      case 'scheduled':
        return 'Scheduled';
      case 'live':
        return 'Live';
      case 'finished':
        return 'Finished';
      default:
        return status;
    }
  }

  getStatusClass(status: Match['status']): string {
    switch (status) {
      case 'live':
        return 'status-live';
      case 'finished':
        return 'status-finished';
      case 'scheduled':
        return 'status-scheduled';
      default:
        return '';
    }
  }

  getBackQueryParams() {
    const round = this.roundQueryParam();
    return round ? { round } : null;
  }

  private formatKickoffDate(kickoffAt: string): string {
    const date = new Date(kickoffAt);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  private formatKickoffTime(kickoffAt: string): string {
    const date = new Date(kickoffAt);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
}
