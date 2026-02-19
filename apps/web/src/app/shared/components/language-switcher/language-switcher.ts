import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { I18nService, type Language } from '../../services/i18n.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="language-switcher" role="group" aria-label="Language selector">
      <button
        *ngFor="let lang of languages"
        [class.active]="lang === currentLanguage()"
        (click)="setLanguage(lang)"
        [attr.aria-label]="'Switch to ' + lang"
        [attr.aria-pressed]="lang === currentLanguage()"
      >
        {{ lang | uppercase }}
      </button>
    </div>
  `,
  styles: [`
    .language-switcher {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    button {
      padding: 0.38rem 0.72rem;
      border: 1px solid rgba(255, 255, 255, 0.34);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.14);
      color: #ffffff;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    button:hover {
      border-color: var(--color-accent);
      background: rgba(255, 255, 255, 0.22);
      color: #ffffff;
    }

    button:focus-visible {
      outline: 2px solid rgba(253, 217, 78, 0.8);
      outline-offset: 2px;
    }

    button.active {
      background: var(--color-accent);
      color: var(--color-text);
      border-color: var(--color-accent);
    }
  `]
})
export class LanguageSwitcherComponent {
  private readonly i18nService = inject(I18nService);

  readonly languages = this.i18nService.supportedLanguages;
  readonly currentLanguage = this.i18nService.currentLanguage$;

  setLanguage(language: Language) {
    this.i18nService.setLanguage(language);
  }
}
