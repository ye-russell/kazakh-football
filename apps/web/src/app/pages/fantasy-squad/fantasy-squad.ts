import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../shared/services/auth.service';
import { FantasyService } from '../../shared/services/fantasy.service';
import { FantasyPlayer, FantasyTeam } from '../../shared/interfaces/api.interfaces';

interface PickDraft {
  playerId: string;
  position: 'GK' | 'DF' | 'MF' | 'FW';
  isCaptain: boolean;
  isViceCaptain: boolean;
  player: FantasyPlayer;
}

const POSITION_LIMITS: Record<string, number> = { GK: 2, DF: 5, MF: 5, FW: 3 };
const MAX_PER_TEAM = 3;
const TOTAL_BUDGET = 100.0;
const SQUAD_SIZE = 15;

type PositionFilter = 'ALL' | 'GK' | 'DF' | 'MF' | 'FW';
type TeamFilter = 'ALL' | string;

@Component({
  selector: 'app-fantasy-squad',
  templateUrl: './fantasy-squad.html',
  styleUrl: './fantasy-squad.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule, TranslatePipe],
})
export class FantasySquad implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly fantasyService = inject(FantasyService);
  private readonly router = inject(Router);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal<string | null>(null);

  protected readonly myTeam = signal<FantasyTeam | null>(null);
  protected readonly allPlayers = signal<FantasyPlayer[]>([]);
  protected readonly picks = signal<PickDraft[]>([]);

  protected readonly positionFilter = signal<PositionFilter>('ALL');
  protected readonly teamFilter = signal<TeamFilter>('ALL');
  protected readonly searchQuery = signal('');

  protected readonly positions: PositionFilter[] = ['ALL', 'GK', 'DF', 'MF', 'FW'];

  protected readonly availableTeams = computed(() => {
    const unique = new Map<string, { id: string; shortName: string; name: string }>();
    for (const player of this.allPlayers()) {
      if (!unique.has(player.team.id)) {
        unique.set(player.team.id, {
          id: player.team.id,
          shortName: player.team.shortName,
          name: player.team.name,
        });
      }
    }
    return [...unique.values()].sort((a, b) => a.shortName.localeCompare(b.shortName));
  });

  protected readonly usedBudget = computed(() =>
    this.picks().reduce((sum, p) => sum + p.player.price, 0),
  );

  protected readonly remainingBudget = computed(() =>
    Math.round((TOTAL_BUDGET - this.usedBudget()) * 10) / 10,
  );

  protected readonly positionCounts = computed(() => {
    const counts: Record<string, number> = { GK: 0, DF: 0, MF: 0, FW: 0 };
    for (const pick of this.picks()) {
      counts[pick.position]++;
    }
    return counts;
  });

  protected readonly teamCounts = computed(() => {
    const map = new Map<string, number>();
    for (const pick of this.picks()) {
      const tid = pick.player.team.id;
      map.set(tid, (map.get(tid) || 0) + 1);
    }
    return map;
  });

  protected readonly pickedIds = computed(() =>
    new Set(this.picks().map((p) => p.playerId)),
  );

  protected readonly filteredPlayers = computed(() => {
    let list = this.allPlayers();

    const team = this.teamFilter();
    if (team !== 'ALL') {
      list = list.filter((p) => p.team.id === team);
    }

    const pos = this.positionFilter();
    if (pos !== 'ALL') {
      list = list.filter((p) => p.position === pos);
    }

    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.team.name.toLowerCase().includes(q) ||
          p.team.shortName.toLowerCase().includes(q),
      );
    }
    return list;
  });

  protected readonly isSquadComplete = computed(
    () => this.picks().length === SQUAD_SIZE,
  );

  protected readonly hasCaptain = computed(() =>
    this.picks().some((p) => p.isCaptain),
  );

  protected readonly hasViceCaptain = computed(() =>
    this.picks().some((p) => p.isViceCaptain),
  );

  protected readonly canSave = computed(
    () =>
      this.isSquadComplete() &&
      this.hasCaptain() &&
      this.hasViceCaptain() &&
      this.remainingBudget() >= 0,
  );

  ngOnInit() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/auth']);
      return;
    }

    this.loading.set(true);

    this.fantasyService.getMyTeam().subscribe({
      next: (team) => {
        if (!team) {
          this.router.navigate(['/fantasy']);
          return;
        }
        this.myTeam.set(team);

        // Initialize picks from existing team
        const existing: PickDraft[] = team.picks.map((p) => ({
          playerId: p.player.id,
          position: p.position,
          isCaptain: p.isCaptain,
          isViceCaptain: p.isViceCaptain,
          player: p.player,
        }));
        this.picks.set(existing);
      },
      error: () => {
        this.router.navigate(['/fantasy']);
      },
    });

    this.fantasyService.getAvailablePlayers().subscribe({
      next: (players) => {
        this.allPlayers.set(players);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load players');
        this.loading.set(false);
      },
    });
  }

  canAddPlayer(player: FantasyPlayer): boolean {
    if (this.pickedIds().has(player.id)) return false;
    if (this.picks().length >= SQUAD_SIZE) return false;

    const pos = player.position || 'MF';
    const counts = this.positionCounts();
    if ((counts[pos] || 0) >= (POSITION_LIMITS[pos] || 0)) return false;

    const teamCount = this.teamCounts().get(player.team.id) || 0;
    if (teamCount >= MAX_PER_TEAM) return false;

    if (this.usedBudget() + player.price > TOTAL_BUDGET) return false;

    return true;
  }

  addPlayer(player: FantasyPlayer) {
    if (!this.canAddPlayer(player)) return;

    this.picks.update((current) => [
      ...current,
      {
        playerId: player.id,
        position: (player.position || 'MF') as PickDraft['position'],
        isCaptain: false,
        isViceCaptain: false,
        player,
      },
    ]);
    this.error.set(null);
    this.success.set(null);
  }

  removePlayer(playerId: string) {
    this.picks.update((current) => current.filter((p) => p.playerId !== playerId));
    this.error.set(null);
    this.success.set(null);
  }

  setCaptain(playerId: string) {
    this.picks.update((current) =>
      current.map((p) => ({
        ...p,
        isCaptain: p.playerId === playerId,
        // If the new captain was the vice-captain, unset VC
        isViceCaptain: p.playerId === playerId ? false : p.isViceCaptain,
      })),
    );
  }

  setViceCaptain(playerId: string) {
    this.picks.update((current) =>
      current.map((p) => ({
        ...p,
        isViceCaptain: p.playerId === playerId,
        // If the new VC was the captain, unset captain
        isCaptain: p.playerId === playerId ? false : p.isCaptain,
      })),
    );
  }

  savePicks() {
    const team = this.myTeam();
    if (!team || !this.canSave()) return;

    this.saving.set(true);
    this.error.set(null);
    this.success.set(null);

    const picks = this.picks().map((p) => ({
      playerId: p.playerId,
      position: p.position,
      isCaptain: p.isCaptain,
      isViceCaptain: p.isViceCaptain,
    }));

    this.fantasyService.updatePicks(team.id, picks).subscribe({
      next: (updated) => {
        this.myTeam.set(updated);
        this.saving.set(false);
        this.success.set('Squad saved successfully!');
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.message || 'Failed to save squad');
      },
    });
  }

  setFilter(pos: PositionFilter) {
    this.positionFilter.set(pos);
  }

  setTeamFilter(teamId: string) {
    this.teamFilter.set(teamId || 'ALL');
  }
}
