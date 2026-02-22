import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { StatsService } from '../../shared/services/stats.service';
import { LeagueStats, PlayerStat } from '../../shared/interfaces/api.interfaces';

type StatsTab = 'scorers' | 'assists' | 'yellowCards' | 'redCards' | 'cleanSheets';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.html',
  styleUrl: './stats.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, TranslateModule, TranslatePipe],
})
export class Stats implements OnInit {
  private readonly statsService = inject(StatsService);

  protected readonly stats = signal<LeagueStats | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly activeTab = signal<StatsTab>('scorers');

  protected readonly tabs: StatsTab[] = [
    'scorers',
    'assists',
    'yellowCards',
    'redCards',
    'cleanSheets',
  ];

  protected readonly activePlayerRows = computed<PlayerStat[]>(() => {
    const data = this.stats();
    if (!data) return [];
    switch (this.activeTab()) {
      case 'scorers':      return data.topScorers;
      case 'assists':      return data.topAssists;
      case 'yellowCards':  return data.mostYellowCards;
      case 'redCards':     return data.mostRedCards;
      case 'cleanSheets':  return data.cleanSheets;
    }
  });

  ngOnInit() {
    this.statsService.getStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('error');
        this.loading.set(false);
      },
    });
  }

  setTab(tab: StatsTab) {
    this.activeTab.set(tab);
  }

  tabKey(tab: StatsTab): string {
    const keys: Record<StatsTab, string> = {
      scorers:     'statsPage.tabs.scorers',
      assists:     'statsPage.tabs.assists',
      yellowCards: 'statsPage.tabs.yellowCards',
      redCards:    'statsPage.tabs.redCards',
      cleanSheets: 'statsPage.tabs.cleanSheets',
    };
    return keys[tab];
  }

  countLabel(tab: StatsTab): string {
    const keys: Record<StatsTab, string> = {
      scorers:     'statsPage.headers.goals',
      assists:     'statsPage.headers.assists',
      yellowCards: 'statsPage.headers.yellowCards',
      redCards:    'statsPage.headers.redCards',
      cleanSheets: 'statsPage.headers.cleanSheets',
    };
    return keys[tab];
  }
}
