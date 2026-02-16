import { ChangeDetectionStrategy, Component, output, input, computed } from '@angular/core';

@Component({
  selector: 'app-matchweek-selector',
  templateUrl: './matchweek-selector.html',
  styleUrl: './matchweek-selector.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchweekSelector {
  readonly round = input.required<number>();
  readonly maxRound = input<number | null>(null);
  readonly roundChanged = output<number>();
  readonly isPreviousDisabled = computed(() => this.round() <= 1);
  readonly isNextDisabled = computed(() => {
    const maxRound = this.maxRound();
    if (!maxRound) {
      return false;
    }
    return this.round() >= maxRound;
  });

  previousRound() {
    if (this.round() > 1) {
      this.roundChanged.emit(this.round() - 1);
    }
  }

  nextRound() {
    if (!this.isNextDisabled()) {
      this.roundChanged.emit(this.round() + 1);
    }
  }
}
