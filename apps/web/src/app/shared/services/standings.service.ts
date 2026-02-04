import { Injectable, inject } from '@angular/core';
import { ApiClient } from '../services/api-client.service';
import { Standing } from '../interfaces/api.interfaces';

@Injectable({
  providedIn: 'root',
})
export class StandingsService {
  private readonly api = inject(ApiClient);

  getStandings() {
    return this.api.get<Standing[]>('/standings');
  }
}
