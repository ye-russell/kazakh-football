import { Injectable, inject } from '@angular/core';
import { Observable, catchError, shareReplay, throwError } from 'rxjs';
import { ApiClient } from '../services/api-client.service';
import { Standing } from '../interfaces/api.interfaces';

@Injectable({
  providedIn: 'root',
})
export class StandingsService {
  private readonly api = inject(ApiClient);
  private readonly cache = new Map<string, Observable<Standing[]>>();

  getStandings() {
    const endpoint = '/standings';
    return this.getCached(endpoint, () => this.api.get<Standing[]>(endpoint));
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

    this.cache.set(key, shared$ as Observable<Standing[]>);
    return shared$;
  }
}
