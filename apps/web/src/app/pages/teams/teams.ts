import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TeamsService } from '../../shared/services/teams.service';
import { Team } from '../../shared/interfaces/api.interfaces';

@Component({
  selector: 'app-teams',
  templateUrl: './teams.html',
  styleUrl: './teams.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
})
export class Teams implements OnInit {
  private readonly teamsService = inject(TeamsService);

  protected readonly teams = signal<Team[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly searchTerm = signal('');

  protected readonly filteredTeams = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.teams();
    }

    return this.teams().filter((team) => {
      const name = team.name.toLowerCase();
      const shortName = team.shortName.toLowerCase();
      const city = team.city?.toLowerCase() ?? '';
      return name.includes(term) || shortName.includes(term) || city.includes(term);
    });
  });

  ngOnInit() {
    this.loadTeams();
  }

  onSearchInput(event: Event) {
    const target = event.target as HTMLInputElement | null;
    this.searchTerm.set(target?.value ?? '');
  }

  private loadTeams() {
    this.loading.set(true);
    this.error.set(null);

    this.teamsService.getTeams().subscribe({
      next: (data) => {
        this.teams.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Failed to load teams');
        this.loading.set(false);
        console.error('Error loading teams:', err);
      },
    });
  }
}
