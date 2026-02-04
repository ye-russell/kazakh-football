import { Injectable, inject } from '@angular/core';
import { ApiClient } from '../services/api-client.service';
import { Match } from '../interfaces/api.interfaces';

@Injectable({
  providedIn: 'root',
})
export class MatchesService {
  private readonly api = inject(ApiClient);

  getMatches(round?: number) {
    const queryParams = new URLSearchParams();
    if (round !== undefined) {
      queryParams.append('round', round.toString());
    }
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/matches?${queryString}` : '/matches';
    return this.api.get<Match[]>(endpoint);
  }

  getMatchById(id: string) {
    return this.api.get<Match>(`/matches/${id}`);
  }
}
