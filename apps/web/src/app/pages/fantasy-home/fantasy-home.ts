import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../shared/services/auth.service';
import { FantasyService } from '../../shared/services/fantasy.service';
import { FantasyTeam, LeaderboardEntry } from '../../shared/interfaces/api.interfaces';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-fantasy-home',
  templateUrl: './fantasy-home.html',
  styleUrl: './fantasy-home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, TranslateModule, TranslatePipe, FormsModule],
})
export class FantasyHome implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly fantasyService = inject(FantasyService);
  private readonly router = inject(Router);

  protected readonly isLoggedIn = this.auth.isLoggedIn;
  protected readonly user = this.auth.user;

  protected readonly myTeam = signal<FantasyTeam | null>(null);
  protected readonly leaderboard = signal<LeaderboardEntry[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  // Create team form
  protected readonly showCreateForm = signal(false);
  protected teamName = '';
  protected readonly creating = signal(false);

  protected readonly squadSummary = computed(() => {
    const team = this.myTeam();
    if (!team || !(team.picks?.length ?? 0)) return null;

    const positions: Record<string, number> = { GK: 0, DF: 0, MF: 0, FW: 0 };
    for (const pick of team.picks ?? []) {
      positions[pick.position]++;
    }
    return positions;
  });

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.loading.set(true);

    // Load leaderboard (public)
    this.fantasyService.getLeaderboard().subscribe({
      next: (data) => this.leaderboard.set(data),
      error: () => {},
    });

    if (this.isLoggedIn()) {
      this.fantasyService.getMyTeam().subscribe({
        next: (team) => {
          this.myTeam.set(team ? this.normalizeTeam(team) : null);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
    } else {
      this.loading.set(false);
    }
  }

  goToLogin() {
    this.router.navigate(['/auth']);
  }

  createTeam() {
    if (!this.teamName.trim()) return;
    this.creating.set(true);

    this.fantasyService.createTeam(this.teamName.trim()).subscribe({
      next: (team) => {
        this.myTeam.set(this.normalizeTeam(team as FantasyTeam));
        this.showCreateForm.set(false);
        this.creating.set(false);
        this.teamName = '';
      },
      error: (err) => {
        this.creating.set(false);
        this.error.set(err?.error?.message || 'Failed to create team');
      },
    });
  }

  logout() {
    this.auth.logout();
    this.myTeam.set(null);
  }

  private normalizeTeam(team: FantasyTeam): FantasyTeam {
    return {
      ...team,
      picks: team.picks ?? [],
    };
  }
}
