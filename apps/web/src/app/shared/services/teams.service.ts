import { Injectable, inject } from '@angular/core';
import { ApiClient } from '../services/api-client.service';
import { Team, LeagueInfo } from '../interfaces/api.interfaces';

@Injectable({
  providedIn: 'root',
})
export class TeamsService {
  private readonly api = inject(ApiClient);

  getTeams() {
    return this.api.get<Team[]>('/teams');
  }

  getTeamById(id: string) {
    return this.api.get<Team>(`/teams/${id}`);
  }

  getLeague() {
    return this.api.get<LeagueInfo>('/league');
  }
}
