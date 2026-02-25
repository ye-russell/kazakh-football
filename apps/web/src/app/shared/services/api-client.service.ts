import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  get<T>(endpoint: string, auth = false) {
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, {
      headers: auth ? this.authHeaders() : undefined,
    });
  }

  post<T>(endpoint: string, body: unknown, auth = false) {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, body, {
      headers: auth ? this.authHeaders() : undefined,
    });
  }

  put<T>(endpoint: string, body: unknown, auth = false) {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, body, {
      headers: auth ? this.authHeaders() : undefined,
    });
  }

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token') ?? '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}
