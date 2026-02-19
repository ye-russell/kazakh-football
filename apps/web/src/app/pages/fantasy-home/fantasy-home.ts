import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-fantasy-home',
  templateUrl: './fantasy-home.html',
  styleUrl: './fantasy-home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, TranslatePipe],
})
export class FantasyHome {}
