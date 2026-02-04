import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-team-detail',
  templateUrl: './team-detail.html',
  styleUrl: './team-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamDetail {}
