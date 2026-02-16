import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Match } from '../../interfaces/api.interfaces';

@Component({
  selector: 'app-matches-list',
  templateUrl: './matches-list.html',
  styleUrl: './matches-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, TranslatePipe],
})
export class MatchesList {
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly matches = input.required<Match[]>();
  readonly loading = input.required<boolean>();
  readonly error = input.required<string | null>();
  readonly round = input<number | null>(null);
  private readonly locale = signal(this.resolveLocale(this.translate.currentLang));
  readonly groupedMatches = computed(() => {
    this.locale();
    return this.buildGroups(this.matches());
  });

  constructor() {
    this.translate.onLangChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      this.locale.set(this.resolveLocale(event.lang));
    });
  }

  formatTime(kickoffAt: string): string {
    try {
      const date = new Date(kickoffAt);
      return date.toLocaleTimeString(this.locale(), { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '-';
    }
  }

  formatDateLabel(kickoffAt: string): string {
    try {
      const date = new Date(kickoffAt);
      return date.toLocaleDateString(this.locale(), {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Matchday';
    }
  }

  getDateKey(kickoffAt: string): string {
    try {
      const date = new Date(kickoffAt);
      return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
        .map((value) => value.toString().padStart(2, '0'))
        .join('-');
    } catch {
      return 'unknown';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'scheduled':
        return 'matches.status.scheduled';
      case 'live':
        return 'matches.status.live';
      case 'finished':
        return 'matches.status.finished';
      default:
        return status;
    }
  }

  getStatusClass(status: string): string {
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

  getLinkQueryParams() {
    const round = this.round();
    return round ? { round } : null;
  }

  private buildGroups(matches: Match[]): Array<{ dateKey: string; dateLabel: string; matches: Match[] }> {
    const groups = new Map<string, { dateKey: string; dateLabel: string; matches: Match[] }>();

    matches.forEach((match) => {
      const dateKey = this.getDateKey(match.kickoffAt);
      if (!groups.has(dateKey)) {
        groups.set(dateKey, {
          dateKey,
          dateLabel: this.formatDateLabel(match.kickoffAt),
          matches: [],
        });
      }

      groups.get(dateKey)?.matches.push(match);
    });

    return Array.from(groups.values());
  }

  private resolveLocale(lang: string | undefined): string {
    if (lang === 'kk') {
      return this.pickSupportedLocale(['kk-KZ', 'kk'], 'en-US');
    }

    if (lang === 'ru') {
      return this.pickSupportedLocale(['ru-RU', 'ru'], 'en-US');
    }

    return this.pickSupportedLocale(['en-US', 'en'], 'en-US');
  }

  private pickSupportedLocale(candidates: string[], fallback: string): string {
    for (const candidate of candidates) {
      if (Intl.DateTimeFormat.supportedLocalesOf(candidate).length > 0) {
        return candidate;
      }
    }

    return fallback;
  }
}
