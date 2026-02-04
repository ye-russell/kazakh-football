import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-matches',
  templateUrl: './matches.html',
  styleUrl: './matches.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Matches {}
