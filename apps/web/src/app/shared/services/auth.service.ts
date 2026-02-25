import { Injectable, inject, signal, computed } from '@angular/core';
import { ApiClient } from './api-client.service';
import { AuthResponse, UserProfile } from '../interfaces/api.interfaces';
import { catchError, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly api = inject(ApiClient);

  private readonly _user = signal<UserProfile | null>(null);
  private readonly _token = signal<string | null>(null);

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._token() !== null);

  constructor() {
    this.restoreSession();
  }

  register(email: string, password: string, displayName: string) {
    return this.api
      .post<AuthResponse>('/auth/register', { email, password, displayName })
      .pipe(
        tap((res) => this.saveSession(res)),
        catchError((err) => throwError(() => err)),
      );
  }

  login(email: string, password: string) {
    return this.api
      .post<AuthResponse>('/auth/login', { email, password })
      .pipe(
        tap((res) => this.saveSession(res)),
        catchError((err) => throwError(() => err)),
      );
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    this._token.set(null);
    this._user.set(null);
  }

  private saveSession(res: AuthResponse) {
    localStorage.setItem('access_token', res.accessToken);
    localStorage.setItem('user', JSON.stringify(res.user));
    this._token.set(res.accessToken);
    this._user.set({
      ...res.user,
      createdAt: new Date().toISOString(),
    });
  }

  private restoreSession() {
    const token = localStorage.getItem('access_token');
    const userJson = localStorage.getItem('user');

    if (token && userJson) {
      try {
        this._token.set(token);
        this._user.set(JSON.parse(userJson));
      } catch {
        this.logout();
      }
    }
  }
}
