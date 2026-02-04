import { ChangeDetectionStrategy, Component, output, input } from '@angular/core';

@Component({
  selector: 'app-matchweek-selector',
  templateUrl: './matchweek-selector.html',
  styleUrl: './matchweek-selector.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchweekSelector {
  readonly round = input.required<number>();
  readonly roundChanged = output<number>();

  previousRound() {
    if (this.round() > 1) {
      this.roundChanged.emit(this.round() - 1);
    }
  }

  nextRound() {
    this.roundChanged.emit(this.round() + 1);
  }

  get isPreviousDisabled(): boolean {
    return this.round() <= 1;
  }
}
