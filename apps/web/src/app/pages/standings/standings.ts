import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-standings',
  templateUrl: './standings.html',
  styleUrl: './standings.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Standings {}
