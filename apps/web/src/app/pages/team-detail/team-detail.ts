import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TeamsService } from '../../shared/services/teams.service';
import { MatchesService } from '../../shared/services/matches.service';
import { Match, Team } from '../../shared/interfaces/api.interfaces';

@Component({
  selector: 'app-team-detail',
  templateUrl: './team-detail.html',
  styleUrl: './team-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
})
export class TeamDetail implements OnInit {
  private readonly teamsService = inject(TeamsService);
  private readonly matchesService = inject(MatchesService);
  private readonly route = inject(ActivatedRoute);

  protected readonly team = signal<Team | null>(null);
  protected readonly matches = signal<Match[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly recentMatches = computed(() => {
    const teamId = this.team()?.id;
    if (!teamId) {
      return [] as Match[];
    }

    return this.matches()
      .filter((match) => match.homeTeam.id === teamId || match.awayTeam.id === teamId)
      .sort((a, b) => new Date(b.kickoffAt).getTime() - new Date(a.kickoffAt).getTime())
      .slice(0, 5);
  });

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const teamId = params.get('id');
      if (teamId) {
        this.loadTeam(teamId);
      }
    });
  }

  private loadTeam(teamId: string) {
    this.loading.set(true);
    this.error.set(null);

    this.teamsService.getTeamById(teamId).subscribe({
      next: (team) => {
        this.team.set(team);
        this.loadMatches();
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Failed to load team');
        this.loading.set(false);
        console.error('Error loading team detail:', err);
      },
    });
  }

  private loadMatches() {
    this.matchesService.getMatches().subscribe({
      next: (data) => {
        this.matches.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Failed to load matches');
        this.loading.set(false);
        console.error('Error loading team matches:', err);
      },
    });
  }

  formatKickoffDate(kickoffAt: string): string {
    const date = new Date(kickoffAt);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}
