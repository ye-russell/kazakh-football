import { Injectable, inject } from '@angular/core';
import { Observable, catchError, shareReplay, throwError } from 'rxjs';
import { ApiClient } from './api-client.service';
import { LeagueStats } from '../interfaces/api.interfaces';

@Injectable({
  providedIn: 'root',
})
export class StatsService {
  private readonly api = inject(ApiClient);
  private readonly cache = new Map<string, Observable<LeagueStats>>();

  getStats(competition = 'kpl'): Observable<LeagueStats> {
    const endpoint = `/stats?competition=${competition}`;
    return this.getCached(endpoint, () => this.api.get<LeagueStats>(endpoint));
  }

  private getCached<T>(key: string, request: () => Observable<T>): Observable<T> {
    const cached = this.cache.get(key) as Observable<T> | undefined;
    if (cached) {
      return cached;
    }

    const shared$ = request().pipe(
      shareReplay({ bufferSize: 1, refCount: false }),
      catchError((error) => {
        this.cache.delete(key);
        return throwError(() => error);
      }),
    );

    this.cache.set(key, shared$ as Observable<LeagueStats>);
    return shared$;
  }
}
