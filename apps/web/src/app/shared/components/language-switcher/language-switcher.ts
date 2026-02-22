import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { I18nService, type Language } from '../../services/i18n.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="language-switcher" [class.open]="isOpen()">
      <button
        type="button"
        class="current-language"
        (click)="toggleMenu($event)"
        aria-label="Language selector"
        aria-haspopup="listbox"
        [attr.aria-expanded]="isOpen()"
      >
        <span>{{ currentLanguage() | uppercase }}</span>
        <span class="menu-icon" aria-hidden="true">☰</span>
      </button>

      <div class="language-menu" role="listbox" aria-label="Language options" [attr.aria-hidden]="!isOpen()">
        @for (lang of languages; track lang) {
          @if (lang !== currentLanguage()) {
            <button
              type="button"
              class="language-option"
              (click)="setLanguage(lang)"
              [attr.aria-label]="'Switch to ' + lang"
              [attr.tabindex]="isOpen() ? 0 : -1"
              role="option"
            >
              {{ lang | uppercase }}
            </button>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .language-switcher {
      position: relative;
    }

    .current-language,
    .language-option {
      width: 100%;
      display: inline-flex;
      align-items: center;
      justify-content: space-between;
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

    .current-language:hover,
    .language-option:hover {
      border-color: var(--color-accent);
      background: rgba(255, 255, 255, 0.22);
      color: #ffffff;
    }

    .current-language:focus-visible,
    .language-option:focus-visible {
      outline: 2px solid rgba(253, 217, 78, 0.8);
      outline-offset: 2px;
    }

    .current-language {
      background: var(--color-accent);
      color: var(--color-text);
      border-color: var(--color-accent);
      gap: 0.5rem;
    }

    .menu-icon {
      font-size: 0.75rem;
      opacity: 0.8;
    }

    .language-menu {
      position: absolute;
      left: 0;
      top: calc(100% + 0.35rem);
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      opacity: 0;
      transform: translateY(-6px) scale(0.98);
      transform-origin: top center;
      pointer-events: none;
      transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .language-switcher.open .language-menu {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    .language-option {
      background: rgba(3, 64, 113, 0.96);
      border-color: rgba(255, 255, 255, 0.26);
      justify-content: center;
      box-shadow: var(--shadow-sm);
    }
  `]
})
export class LanguageSwitcherComponent {
  private readonly i18nService = inject(I18nService);
  private readonly hostElement = inject(ElementRef<HTMLElement>);

  readonly languages = this.i18nService.supportedLanguages;
  readonly currentLanguage = this.i18nService.currentLanguage$;
  readonly isOpen = signal(false);

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.isOpen.update((open) => !open);
  }

  setLanguage(language: Language) {
    this.i18nService.setLanguage(language);
    this.isOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(event: Event) {
    if (!this.hostElement.nativeElement.contains(event.target as Node)) {
      this.isOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  closeOnEscape() {
    this.isOpen.set(false);
  }
}
