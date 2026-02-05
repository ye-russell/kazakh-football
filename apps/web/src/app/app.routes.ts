import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./core/layout/layout').then((m) => m.Layout),
    children: [
      { path: '', loadComponent: () => import('./pages/home/home').then((m) => m.Home) },
      { path: 'standings', loadComponent: () => import('./pages/standings/standings').then((m) => m.Standings) },
      { path: 'matches', loadComponent: () => import('./pages/matches/matches').then((m) => m.Matches) },
      { path: 'matches/:id', loadComponent: () => import('./pages/match-detail/match-detail').then((m) => m.MatchDetail) },
      { path: 'teams', loadComponent: () => import('./pages/teams/teams').then((m) => m.Teams) },
      { path: 'teams/:id', loadComponent: () => import('./pages/team-detail/team-detail').then((m) => m.TeamDetail) },
    ]
  }
];
