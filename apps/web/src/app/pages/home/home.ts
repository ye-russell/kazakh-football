import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatchesService } from '../../shared/services/matches.service';
import { StandingsService } from '../../shared/services/standings.service';
import { MatchweekSelector } from '../../shared/components/matchweek-selector/matchweek-selector';
import { MatchesList } from '../../shared/components/matches-list/matches-list';
import { Match, Standing } from '../../shared/interfaces/api.interfaces';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatchweekSelector, MatchesList, RouterLink],
})
export class Home implements OnInit {
  private readonly matchesService = inject(MatchesService);
  private readonly standingsService = inject(StandingsService);
  private readonly router = inject(Router);

  protected readonly currentRound = signal(1);
  protected readonly matches = signal<Match[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly standings = signal<Standing[]>([]);
  protected readonly standingsLoading = signal(true);
  protected readonly standingsError = signal<string | null>(null);

  protected readonly topStandings = computed(() => this.standings().slice(0, 5));

  ngOnInit() {
    // Load matches for current round
    this.loadMatches(this.currentRound());

    // Load standings snapshot
    this.loadStandings();
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
        this.error.set('Failed to load matches');
        this.loading.set(false);
      },
    });
  }

  onRoundChanged(round: number) {
    this.currentRound.set(round);
    this.loadMatches(round);
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
      error: (err) => {
        this.standingsError.set('Failed to load standings');
        this.standingsLoading.set(false);
      },
    });
  }
}
