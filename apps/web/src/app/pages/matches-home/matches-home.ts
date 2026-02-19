import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { MatchesService } from '../../shared/services/matches.service';
import { StandingsService } from '../../shared/services/standings.service';
import { LeagueService } from '../../shared/services/league.service';
import { MatchweekSelector } from '../../shared/components/matchweek-selector/matchweek-selector';
import { MatchesList } from '../../shared/components/matches-list/matches-list';
import { Match, Standing } from '../../shared/interfaces/api.interfaces';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-matches-home',
  templateUrl: './matches-home.html',
  styleUrl: './matches-home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatchweekSelector, MatchesList, RouterLink, TranslateModule, TranslatePipe],
})
export class MatchesHome implements OnInit {
  private readonly matchesService = inject(MatchesService);
  private readonly standingsService = inject(StandingsService);
  private readonly leagueService = inject(LeagueService);
  private readonly router = inject(Router);

  protected readonly currentRound = signal(1);
  protected readonly maxRound = signal<number | null>(null);
  protected readonly matches = signal<Match[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly standings = signal<Standing[]>([]);
  protected readonly standingsLoading = signal(true);
  protected readonly standingsError = signal<string | null>(null);

  protected readonly topStandings = computed(() => this.standings().slice(0, 5));

  ngOnInit() {
    this.loadLeague();
    this.loadStandings();
  }

  private loadLeague() {
    this.leagueService.getLeague().subscribe({
      next: (data) => {
        const competition = data.competitions.find((item) => item.code === 'kpl');
        const round = competition?.currentRound ?? 1;
        const maxRound = competition?.maxRound ?? null;
        this.maxRound.set(maxRound);
        this.currentRound.set(round);
        this.loadMatches(round);
      },
      error: () => {
        this.loadMatches(this.currentRound());
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
      error: () => {
        this.error.set('Failed to load matches');
        this.loading.set(false);
      },
    });
  }

  onRoundChanged(round: number) {
    const maxRound = this.maxRound();
    const nextRound = maxRound ? Math.min(round, maxRound) : round;
    this.currentRound.set(nextRound);
    this.loadMatches(nextRound);
  }

  viewAllMatches() {
    this.router.navigate(['/matches'], { queryParams: { round: this.currentRound() } });
  }

  private loadStandings() {
    this.standingsLoading.set(true);
    this.standingsError.set(null);

    this.standingsService.getStandings().subscribe({
      next: (data) => {
        this.standings.set(data);
        this.standingsLoading.set(false);
      },
      error: () => {
        this.standingsError.set('Failed to load standings');
        this.standingsLoading.set(false);
      },
    });
  }
}
