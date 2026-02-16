import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { I18nService, type Language } from '../../services/i18n.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="language-switcher">
      <button
        *ngFor="let lang of languages"
        [class.active]="lang === currentLanguage()"
        (click)="setLanguage(lang)"
        [attr.aria-label]="'Switch to ' + lang"
      >
        {{ lang | uppercase }}
      </button>
    </div>
  `,
  styles: [`
    .language-switcher {
      display: flex;
      gap: 0.5rem;
    }

    button {
      padding: 0.4rem 0.8rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s;
    }

    button:hover {
      border-color: #007bff;
      color: #007bff;
    }

    button.active {
      background: #007bff;
      color: white;
      border-color: #007bff;
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
