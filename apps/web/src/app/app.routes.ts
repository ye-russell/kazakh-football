import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./core/layout/layout').then((m) => m.Layout),
    children: [
      { path: '', redirectTo: () => (window.innerWidth <= 650 ? 'matches' : 'matches-home'), pathMatch: 'full' },
      { path: 'matches-home', loadComponent: () => import('./pages/matches-home/matches-home').then((m) => m.MatchesHome) },
      { path: 'matches', loadComponent: () => import('./pages/matches/matches').then((m) => m.Matches) },
      { path: 'matches/:id', loadComponent: () => import('./pages/match-detail/match-detail').then((m) => m.MatchDetail) },
      { path: 'standings', loadComponent: () => import('./pages/standings/standings').then((m) => m.Standings) },
      { path: 'stats', loadComponent: () => import('./pages/stats/stats').then((m) => m.Stats) },
      { path: 'fantasy', loadComponent: () => import('./pages/fantasy-home/fantasy-home').then((m) => m.FantasyHome) },
      { path: 'teams/:id', loadComponent: () => import('./pages/team-detail/team-detail').then((m) => m.TeamDetail) },
    ]
  }
];
