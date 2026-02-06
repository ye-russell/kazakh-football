import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Match } from '../../interfaces/api.interfaces';

@Component({
  selector: 'app-matches-list',
  templateUrl: './matches-list.html',
  styleUrl: './matches-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
})
export class MatchesList {
  readonly matches = input.required<Match[]>();
  readonly loading = input.required<boolean>();
  readonly error = input.required<string | null>();
  readonly round = input<number | null>(null);
  readonly groupedMatches = computed(() => this.buildGroups(this.matches()));

  formatTime(kickoffAt: string): string {
    try {
      const date = new Date(kickoffAt);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '-';
    }
  }

  formatDateLabel(kickoffAt: string): string {
    try {
      const date = new Date(kickoffAt);
      return date.toLocaleDateString('en-US', {
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
        return 'Scheduled';
      case 'live':
        return 'Live';
      case 'finished':
        return 'Finished';
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
}
