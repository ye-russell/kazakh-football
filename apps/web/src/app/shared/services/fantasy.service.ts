import { Injectable, inject } from '@angular/core';
import { Observable, catchError, shareReplay, throwError } from 'rxjs';
import { ApiClient } from './api-client.service';
import {
  FantasyTeam,
  FantasyPlayer,
  LeaderboardEntry,
  GameweekPoints,
} from '../interfaces/api.interfaces';

@Injectable({
  providedIn: 'root',
})
export class FantasyService {
  private readonly api = inject(ApiClient);
  private readonly cache = new Map<string, Observable<unknown>>();

  getMyTeam(competition = 'kpl'): Observable<FantasyTeam | null> {
    // Never cache my-team (may change after picks)
    return this.api.get<FantasyTeam | null>(
      `/fantasy/my-team?competition=${competition}`,
      true,
    );
  }

  getTeamById(id: string): Observable<FantasyTeam> {
    const endpoint = `/fantasy/teams/${id}`;
    return this.getCached(endpoint, () =>
      this.api.get<FantasyTeam>(endpoint),
    );
  }

  createTeam(name: string, competition = 'kpl'): Observable<FantasyTeam> {
    this.clearCache();
    return this.api.post<FantasyTeam>(
      '/fantasy/teams',
      { name, competition },
      true,
    );
  }

  updatePicks(
    teamId: string,
    picks: Array<{
      playerId: string;
      position: string;
      isCaptain?: boolean;
      isViceCaptain?: boolean;
    }>,
  ): Observable<FantasyTeam> {
    this.clearCache();
    return this.api.put<FantasyTeam>(
      `/fantasy/teams/${teamId}/picks`,
      { picks },
      true,
    );
  }

  getAvailablePlayers(competition = 'kpl'): Observable<FantasyPlayer[]> {
    const endpoint = `/fantasy/players?competition=${competition}`;
    return this.getCached(endpoint, () =>
      this.api.get<FantasyPlayer[]>(endpoint),
    );
  }

  getLeaderboard(competition = 'kpl'): Observable<LeaderboardEntry[]> {
    const endpoint = `/fantasy/leaderboard?competition=${competition}`;
    return this.getCached(endpoint, () =>
      this.api.get<LeaderboardEntry[]>(endpoint),
    );
  }

  getGameweekPoints(teamId: string): Observable<GameweekPoints[]> {
    const endpoint = `/fantasy/teams/${teamId}/gameweeks`;
    return this.getCached(endpoint, () =>
      this.api.get<GameweekPoints[]>(endpoint),
    );
  }

  clearCache() {
    this.cache.clear();
  }

  private getCached<T>(key: string, request: () => Observable<T>): Observable<T> {
    const cached = this.cache.get(key) as Observable<T> | undefined;
    if (cached) return cached;

    const shared$ = request().pipe(
      shareReplay({ bufferSize: 1, refCount: false }),
      catchError((error) => {
        this.cache.delete(key);
        return throwError(() => error);
      }),
    );

    this.cache.set(key, shared$ as Observable<unknown>);
    return shared$;
  }
}
