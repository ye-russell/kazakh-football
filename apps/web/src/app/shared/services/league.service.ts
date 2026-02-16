import { Injectable, inject } from '@angular/core';
import { Observable, catchError, shareReplay, throwError } from 'rxjs';
import { ApiClient } from './api-client.service';
import { LeagueInfo } from '../interfaces/api.interfaces';

@Injectable({
  providedIn: 'root',
})
export class LeagueService {
  private readonly api = inject(ApiClient);
  private readonly cache = new Map<string, Observable<LeagueInfo>>();

  getLeague() {
    const endpoint = '/league';
    return this.getCached(endpoint, () => this.api.get<LeagueInfo>(endpoint));
  }

  private getCached<T>(key: string, request: () => Observable<T>) {
    const cached = this.cache.get(key) as Observable<T> | undefined;
    if (cached) {
      return cached;
    }

    const shared$ = request().pipe(
      shareReplay({ bufferSize: 1, refCount: false }),
      catchError((error) => {
        this.cache.delete(key);
        return throwError(() => error);
      })
    );

    this.cache.set(key, shared$ as Observable<LeagueInfo>);
    return shared$;
  }
}
