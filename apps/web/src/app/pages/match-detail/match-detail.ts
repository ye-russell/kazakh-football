import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatchesService } from '../../shared/services/matches.service';
import { Match, MatchEvent, MatchLineup } from '../../shared/interfaces/api.interfaces';

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

  protected readonly eventsByTeam = computed(() => {
    const match = this.match();
    if (!match?.events?.length) {
      return { home: [] as MatchEvent[], away: [] as MatchEvent[] };
    }

    return {
      home: match.events.filter((event) => event.team.id === match.homeTeam.id),
      away: match.events.filter((event) => event.team.id === match.awayTeam.id),
    };
  });

  protected readonly lineupsByTeam = computed(() => {
    const match = this.match();
    if (!match?.lineups?.length) {
      return {
        home: { starters: [] as MatchLineup[], bench: [] as MatchLineup[] },
        away: { starters: [] as MatchLineup[], bench: [] as MatchLineup[] },
      };
    }

    const homeLineups = match.lineups.filter((lineup) => lineup.team.id === match.homeTeam.id);
    const awayLineups = match.lineups.filter((lineup) => lineup.team.id === match.awayTeam.id);

    return {
      home: {
        starters: homeLineups.filter((lineup) => lineup.isStarter),
        bench: homeLineups.filter((lineup) => !lineup.isStarter),
      },
      away: {
        starters: awayLineups.filter((lineup) => lineup.isStarter),
        bench: awayLineups.filter((lineup) => !lineup.isStarter),
      },
    };
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

  getEventMinute(event: MatchEvent): string {
    if (event.extraMinute) {
      return `${event.minute}+${event.extraMinute}'`;
    }
    return `${event.minute}'`;
  }

  getEventLabel(event: MatchEvent): string {
    switch (event.type) {
      case 'goal':
        return 'Goal';
      case 'yellow_card':
        return 'Yellow card';
      case 'red_card':
        return 'Red card';
      case 'substitution':
        return 'Substitution';
      default:
        return event.type;
    }
  }

  getEventDetail(event: MatchEvent): string {
    if (event.type === 'goal') {
      const assist = event.assistPlayer ? ` (assist ${event.assistPlayer.name})` : '';
      return `${event.player.name}${assist}`;
    }

    if (event.type === 'substitution') {
      const subIn = event.subInPlayer ? event.subInPlayer.name : 'Sub in';
      const subOut = event.subOutPlayer ? event.subOutPlayer.name : 'Sub out';
      return `${subIn} ⇄ ${subOut}`;
    }

    return event.player.name;
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
