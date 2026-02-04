import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-match-detail',
  templateUrl: './match-detail.html',
  styleUrl: './match-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchDetail {}
