import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { FantasyService } from '../../shared/services/fantasy.service';
import {
  GameweekPoints,
  GameweekDetail,
} from '../../shared/interfaces/api.interfaces';

@Component({
  selector: 'app-fantasy-gameweeks',
  templateUrl: './fantasy-gameweeks.html',
  styleUrl: './fantasy-gameweeks.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, TranslateModule, TranslatePipe],
})
export class FantasyGameweeks implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fantasyService = inject(FantasyService);

  protected readonly loading = signal(true);
  protected readonly gameweeks = signal<GameweekPoints[]>([]);
  protected readonly selectedRound = signal<number | null>(null);
  protected readonly detail = signal<GameweekDetail | null>(null);
  protected readonly detailLoading = signal(false);

  private teamId = '';

  ngOnInit() {
    this.teamId = this.route.snapshot.paramMap.get('id') ?? '';

    this.fantasyService.getGameweekPoints(this.teamId).subscribe({
      next: (data) => {
        this.gameweeks.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  selectRound(round: number) {
    if (this.selectedRound() === round) {
      // Toggle off
      this.selectedRound.set(null);
      this.detail.set(null);
      return;
    }

    this.selectedRound.set(round);
    this.detailLoading.set(true);
    this.detail.set(null);

    this.fantasyService
      .getGameweekPlayerBreakdown(this.teamId, round)
      .subscribe({
        next: (data) => {
          this.detail.set(data);
          this.detailLoading.set(false);
        },
        error: () => {
          this.detailLoading.set(false);
        },
      });
  }

  breakdownLabel(key: string): string {
    const labels: Record<string, string> = {
      appearance: 'Appearance',
      cleanSheet: 'Clean Sheet',
      goals: 'Goals',
      assists: 'Assists',
      yellowCards: 'Yellow Card',
      redCards: 'Red Card',
    };
    return labels[key] ?? key;
  }
}
