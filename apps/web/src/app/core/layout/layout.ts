import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.html',
  styleUrl: './layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslateModule, TranslatePipe, LanguageSwitcherComponent],
})
export class Layout {
  private readonly router = inject(Router);
  protected readonly homeLink = window.innerWidth <= 650 ? '/matches' : '/matches-home';

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly inMatchesSection = computed(() => {
    const url = this.currentUrl();
    return (
      url === '/' ||
      url.startsWith('/matches') ||
      url.startsWith('/standings') ||
      url.startsWith('/stats') ||
      url.startsWith('/teams')
    );
  });

  protected readonly inFantasySection = computed(() => this.currentUrl().startsWith('/fantasy'));
}
