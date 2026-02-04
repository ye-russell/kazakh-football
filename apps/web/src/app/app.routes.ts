import { Routes } from '@angular/router';
import { Layout } from './core/layout/layout';
import { Home } from './pages/home/home';
import { Standings } from './pages/standings/standings';
import { Matches } from './pages/matches/matches';
import { MatchDetail } from './pages/match-detail/match-detail';
import { Teams } from './pages/teams/teams';
import { TeamDetail } from './pages/team-detail/team-detail';

export const routes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: '', component: Home },
      { path: 'standings', component: Standings },
      { path: 'matches', component: Matches },
      { path: 'matches/:id', component: MatchDetail },
      { path: 'teams', component: Teams },
      { path: 'teams/:id', component: TeamDetail },
    ]
  }
];
