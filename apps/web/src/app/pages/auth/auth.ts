import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../shared/services/auth.service';

type AuthMode = 'login' | 'register';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-auth',
  templateUrl: './auth.html',
  styleUrl: './auth.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TranslateModule, TranslatePipe],
})
export class Auth {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  protected readonly mode = signal<AuthMode>('login');
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly submitted = signal(false);

  // Form field signals so computed() can track them
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly confirmPassword = signal('');
  protected readonly displayName = signal('');

  // Validation errors — computed from signal field values
  protected readonly emailError = computed(() => {
    const val = this.email().trim();
    if (!this.submitted()) return null;
    if (!val) return this.t('auth.validation.required');
    if (!EMAIL_RE.test(val)) return this.t('auth.validation.invalidEmail');
    return null;
  });

  protected readonly passwordError = computed(() => {
    const val = this.password();
    if (!this.submitted()) return null;
    if (!val) return this.t('auth.validation.required');
    if (val.length < 6) return this.t('auth.validation.passwordMinLength');
    return null;
  });

  protected readonly confirmPasswordError = computed(() => {
    const val = this.confirmPassword();
    const pwd = this.password();
    if (!this.submitted() || this.mode() !== 'register') return null;
    if (!val) return this.t('auth.validation.required');
    if (val !== pwd) return this.t('auth.validation.passwordMismatch');
    return null;
  });

  protected readonly displayNameError = computed(() => {
    const val = this.displayName().trim();
    if (!this.submitted() || this.mode() !== 'register') return null;
    if (!val) return this.t('auth.validation.required');
    if (val.length < 2) return this.t('auth.validation.displayNameMinLength');
    if (val.length > 50) return this.t('auth.validation.displayNameMaxLength');
    return null;
  });

  toggleMode() {
    this.mode.update((m) => (m === 'login' ? 'register' : 'login'));
    this.error.set(null);
    this.submitted.set(false);
  }

  submit() {
    this.submitted.set(true);
    this.error.set(null);

    // Check all validation
    if (this.emailError() || this.passwordError()) return;
    if (this.mode() === 'register') {
      if (this.displayNameError() || this.confirmPasswordError()) return;
    }

    this.loading.set(true);

    const obs$ =
      this.mode() === 'login'
        ? this.authService.login(this.email().trim(), this.password())
        : this.authService.register(this.email().trim(), this.password(), this.displayName().trim());

    obs$.subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/fantasy']);
      },
      error: (err) => {
        this.loading.set(false);
        const body = err?.error;
        const msg =
          (Array.isArray(body?.message) ? body.message.join(', ') : body?.message)
          || err?.message
          || 'An error occurred';
        this.error.set(msg);
      },
    });
  }

  private t(key: string): string {
    return this.translate.instant(key);
  }
}
