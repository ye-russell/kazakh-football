import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-teams',
  templateUrl: './teams.html',
  styleUrl: './teams.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Teams {}
