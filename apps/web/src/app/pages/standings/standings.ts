import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StandingsService } from '../../shared/services/standings.service';
import { Standing } from '../../shared/interfaces/api.interfaces';

@Component({
  selector: 'app-standings',
  templateUrl: './standings.html',
  styleUrl: './standings.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class Standings implements OnInit {
  private readonly standingsService = inject(StandingsService);

  protected readonly standings = signal<Standing[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  // Computed standings with position (rank)
  protected readonly standingsWithPosition = computed(() => {
    return this.standings().map((standing, index) => ({
      ...standing,
      position: index + 1,
    }));
  });

  ngOnInit() {
    this.loadStandings();
  }

  private loadStandings() {
    this.loading.set(true);
    this.error.set(null);

    this.standingsService.getStandings().subscribe({
      next: (data) => {
        this.standings.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Failed to load standings');
        this.loading.set(false);
        console.error('Error loading standings:', err);
      },
    });
  }
}
