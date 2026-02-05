import { Injectable, inject } from '@angular/core';
import { Observable, catchError, shareReplay, throwError } from 'rxjs';
import { ApiClient } from '../services/api-client.service';
import { Match } from '../interfaces/api.interfaces';

@Injectable({
  providedIn: 'root',
})
export class MatchesService {
  private readonly api = inject(ApiClient);
  private readonly cache = new Map<string, Observable<Match[] | Match>>();

  getMatches(round?: number) {
    const queryParams = new URLSearchParams();
    if (round !== undefined) {
      queryParams.append('round', round.toString());
    }
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/matches?${queryString}` : '/matches';
    return this.getCached(endpoint, () => this.api.get<Match[]>(endpoint));
  }

  getMatchById(id: string) {
    const endpoint = `/matches/${id}`;
    return this.getCached(endpoint, () => this.api.get<Match>(endpoint));
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

    this.cache.set(key, shared$ as Observable<Match[] | Match>);
    return shared$;
  }
}
