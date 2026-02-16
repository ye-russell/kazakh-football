import { Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type Language = 'en' | 'kk' | 'ru';

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private readonly currentLanguage = signal<Language>('en');
  readonly currentLanguage$ = this.currentLanguage.asReadonly();

  readonly supportedLanguages: Language[] = ['en', 'kk', 'ru'];

  constructor(private readonly translate: TranslateService) {
    this.initializeLanguage();
  }

  private initializeLanguage() {
    const savedLanguage = this.getSavedLanguage();
    const browserLanguage = this.detectBrowserLanguage();
    const language = savedLanguage || browserLanguage || 'en';

    this.setLanguage(language);
  }

  setLanguage(language: Language) {
    if (!this.supportedLanguages.includes(language)) {
      language = 'en';
    }

    this.currentLanguage.set(language);
    this.translate.use(language);
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }

  getCurrentLanguage(): Language {
    return this.currentLanguage();
  }

  private getSavedLanguage(): Language | null {
    const saved = localStorage.getItem('language');
    if (saved && this.supportedLanguages.includes(saved as Language)) {
      return saved as Language;
    }
    return null;
  }

  private detectBrowserLanguage(): Language {
    const browserLang = this.translate.getBrowserLang();
    if (browserLang && this.supportedLanguages.includes(browserLang as Language)) {
      return browserLang as Language;
    }

    // Check for language variants (e.g., 'ru-RU' -> 'ru')
    if (browserLang) {
      const langCode = browserLang.split('-')[0];
      if (this.supportedLanguages.includes(langCode as Language)) {
        return langCode as Language;
      }
    }

    return 'en';
  }
}
