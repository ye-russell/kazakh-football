# Kazakh Football App – Deep Technical & Product Summary

> Last updated: March 1, 2026

## 1. Product Vision

The goal of the **Kazakh Football** app is to create a modern, reliable, and extensible digital platform for football competitions in Kazakhstan, starting with the **Kazakhstan Premier League (KPL)** and later expanding to:
- First League
- League statistics (top scorers, assists, disciplinary)
- Player information & profiles
- Transfers
- News aggregation
- **Fantasy football** ✅

The app is inspired by products like the official **Premier League app**, but tailored for the Kazakh football ecosystem, where no high-quality public API currently exists.

Key principles:
- Accuracy over real-time speed
- Human-in-the-loop where automation is unavailable
- Clean architecture with future scalability
- Public-read platform with potential API reuse

---

## 2. Platform Strategy

### Target platforms
- Web (desktop & mobile)
- Android
- iOS

### Technical approach
- **Single frontend codebase** (Angular 21 SPA)
- Wrapped for mobile stores via **Capacitor**
- Backend-first development to stabilize data contracts

---

## 3. Monorepo Structure

The project is implemented as a **pnpm monorepo**:

```
kazakh-football/
├── apps/
│   ├── api/           # NestJS 11 backend (REST API)
│   │   ├── prisma/    # Schema, migrations (5), seed script
│   │   └── src/       # 10 domain modules + common filters
│   └── web/           # Angular 21 frontend
│       ├── public/    # i18n JSONs (en, kk, ru)
│       └── src/app/   # 10 routed pages, 3 shared components, 10+ services
├── packages/          # Shared DTOs / types (planned, not yet used)
└── docs/              # This file
```

Benefits:
- Shared types between FE and BE (when `packages/` is populated)
- Unified CI/CD
- Easier refactoring early in the project lifecycle

---

## 4. Backend Architecture

### Stack
| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 20+ | Runtime |
| NestJS | 11.x | REST API framework |
| TypeScript | 5.7+ | Language |
| Prisma | 5.x | ORM, migrations, type-safe DB access |
| PostgreSQL | — | Database (Supabase-hosted) |
| Swagger | @nestjs/swagger | API documentation at `/docs` (with Bearer auth) |
| class-validator | — | DTO validation |
| @nestjs/jwt | — | JWT token generation & verification |
| passport-jwt | — | JWT authentication strategy |
| bcrypt | — | Password hashing |
| Jest | 30.x | Unit & e2e testing |

### Module architecture
```
AppModule
├── ConfigModule (global, .env)
├── PrismaModule (global, DB access)
├── HealthModule       → GET /health
├── LeagueModule       → GET /league
├── TeamsModule        → GET /teams, /teams/:id
├── MatchesModule      → GET /matches, /matches/:id
├── StandingsModule    → GET /standings (computed)
├── StatsModule        → GET /stats (aggregated leaderboards)
├── PlayersModule      → GET /players, /players/:id
├── AuthModule         → POST /auth/register, /auth/login, GET /auth/profile
└── FantasyModule      → Fantasy teams, picks, leaderboard, scoring, admin trigger
```

### Backend philosophy
- Read-heavy API with authenticated write endpoints for fantasy
- JWT-based authentication (register/login, protected routes via guards)
- Computed data (standings) instead of stored aggregates
- Clear separation of concerns (one module per domain)
- Global exception filter for consistent error shapes
- DTO validation via class-validator + class-transformer
- UUID validation on path params via NestJS ParseUUIDPipe

---

## 5. Database Strategy

### Why Supabase
- Managed PostgreSQL with no vendor lock-in
- Reliable cloud hosting
- Built-in DB UI (admin & manual updates)
- Easy future expansion (auth, storage, realtime)

Supabase is used **only as a database** at this stage; Prisma is the exclusive data access layer.

### ORM: Prisma
- Schema-first design
- Type-safe DB access with generated client
- Predictable migrations (4 migrations to date)
- Strong tooling (Prisma Studio, seed scripts)

---

## 6. Data Model (Current)

### Entity relationship diagram
```
Competition ──< Match >── Team (home/away)
                 │
                 ├──< MatchEvent (goal, yellow_card, red_card, substitution)
                 │        │
                 │        └── Player (scorer, assist, subIn, subOut)
                 │
                 └──< MatchLineup
                          └── Player (isStarter, position)

Team ──< Player (name, number, position, price)
              │
              └──< FantasyPick

User ──< FantasyTeam ──< FantasyPick ──> Player
              │
              └──< FantasyGameweek (round, points)
```

### Core entities

| Entity | Key Fields | Notes |
|--------|-----------|-------|
| **Competition** | id, code (unique), name, season | KPL, First League |
| **Team** | id, name (unique), shortName, city?, logoUrl? | 12 teams seeded |
| **Match** | id, competitionId, round, kickoffAt, status, homeTeamId, awayTeamId, homeScore?, awayScore? | Constraint: home ≠ away |
| **Player** | id, teamId, name, number?, position?, price? | 48 players seeded (4 per team) with fantasy prices |
| **MatchEvent** | id, matchId, teamId, playerId, type, minute, extraMinute?, assistPlayerId?, subInPlayerId?, subOutPlayerId? | Cascade on match delete |
| **MatchLineup** | id, matchId, teamId, playerId, isStarter, position? | Unique (matchId, playerId), cascade on match delete |
| **User** | id, email (unique), displayName, passwordHash | bcrypt-hashed passwords |
| **FantasyTeam** | id, userId, competitionId, name, budget (100.0), totalPoints | Unique (userId, competitionId) |
| **FantasyPick** | id, fantasyTeamId, playerId, position (GK/DF/MF/FW), isCaptain, isViceCaptain | Unique (fantasyTeamId, playerId) |
| **FantasyGameweek** | id, fantasyTeamId, round, points | Unique (fantasyTeamId, round) |

### Enums
- **MatchStatus**: `scheduled`, `live`, `finished`
- **MatchEventType**: `goal`, `yellow_card`, `red_card`, `substitution`
- **FantasyPickPosition**: `GK`, `DF`, `MF`, `FW`

### Indexes
- `(competitionId, round)`, `(competitionId, kickoffAt)` on Match
- `status`, `homeTeamId`, `awayTeamId` on Match
- `teamId`, `name` on Player
- `matchId`, `teamId`, `playerId`, `type` on MatchEvent
- `matchId`, `teamId`, `playerId` on MatchLineup

---

## 7. Live Matches Strategy

### Chosen level: Level 1 Live
- Match status updates (scheduled → live → finished)
- Score updates
- No minute-by-minute events initially

### Update mechanism
- Manual updates via Supabase UI (human-in-the-loop)
- Frontend polling every 30–60 seconds (not yet implemented)

### Reasoning
- No reliable KPL live data API exists
- Avoids legal and reliability risks
- Proven approach for early-stage sports platforms

---

## 8. Admin & AI Usage Philosophy

### Admin workflow
- No public write endpoints
- Manual updates via Supabase UI
- Future: minimal internal admin UI or CLI

### AI usage
- AI as **assistant**, not autonomous writer
- Generate structured JSON from unstructured matchday/news text
- Human review before applying DB changes
- No direct DB access for AI agents

---

## 9. Frontend Architecture

### Stack
| Technology | Version | Purpose |
|-----------|---------|---------|
| Angular | 21.1 | SPA framework |
| TypeScript | 5.9 | Language |
| @ngx-translate/core | 17.x | i18n (EN, KK, RU) |
| CSS | Custom properties | Styling (no preprocessor) |
| Vitest | 4.x | Unit testing |
| esbuild | — | Build tool (via @angular/build) |

### Architecture decisions
- **Standalone components** — no NgModules anywhere
- **OnPush change detection** — on every component
- **Angular Signals** — `signal()`, `computed()`, `effect()` for reactive state
- **Lazy-loaded routes** — all page components via `loadComponent`
- **Single layout shell** — `LayoutComponent` wraps all routes with header + nav

### Component inventory

| Type | Count | Items |
|------|-------|-------|
| Root | 1 | `App` |
| Layout | 1 | `Layout` (header, nav, fantasy sub-nav, responsive bottom bar) |
| Pages | 11 (routed) | `MatchesHome`, `Matches`, `MatchDetail`, `Standings`, `TeamDetail`, `Stats`, `Auth`, `FantasyHome`, `FantasySquad`, `FantasyGameweeks`, `Home` |
| Unrouted | 1 | `Teams` (exists, not routed) |
| Shared | 3 | `MatchList`, `MatchweekSelector`, `LanguageSwitcher` |
| Services | 10+ | `ApiClient`, `LeagueService`, `MatchesService`, `StandingsService`, `TeamsService`, `StatsService`, `AuthService`, `FantasyService`, `LanguageService`, `TranslateHttpLoader` |
| Interfaces | 1+ files | 18+ interfaces/types in `api.interfaces.ts` + fantasy interfaces |

### Route table

| Path | Component | Notes |
|------|-----------|-------|
| `/` | redirect | → `/matches-home` (mobile ≤650px) or `/matches-home` (desktop) |
| `/matches-home` | `MatchesHome` | Desktop dashboard (fixtures, standings, top scorer) |
| `/matches` | `Matches` | Full match list + matchweek selector |
| `/matches/:id` | `MatchDetail` | Match events + lineups |
| `/standings` | `Standings` | Full league table |
| `/stats` | `Stats` | 5-tab leaderboard (scorers, assists, yellow cards, red cards, clean sheets) |
| `/auth` | `Auth` | Login / Register with client-side validation |
| `/fantasy` | `FantasyHome` | Fantasy dashboard — team creation, squad overview, leaderboard |
| `/fantasy/squad` | `FantasySquad` | Squad builder — pick players, set captain, manage budget |
| `/fantasy/gameweeks/:id` | `FantasyGameweeks` | Gameweek history — per-round points with player breakdowns |
| `/teams/:id` | `TeamDetail` | Team info + recent matches |

### Caching strategy
All services use manual `Map<string, Observable>` caching with `shareReplay({ bufferSize: 1, refCount: false })`, clearing cache on errors. This is a simple but effective pattern for read-heavy, rarely-changing data.

### i18n
- 3 languages: English (`en`), Kazakh (`kk`), Russian (`ru`)
- JSON-based translation files loaded via HTTP
- `LanguageService` persists choice to `localStorage`
- Sets `document.documentElement.lang` for accessibility

### Responsive design
- Mobile-first CSS with breakpoints at 420/500/600/650/768/900/1024px
- Bottom fixed nav bar on ≤500px screens
- Adaptive home redirect based on viewport width
- Short/Full table toggle on standings page for mobile

---

## 10. API Design Principles

- Read-only by default
- Deterministic responses
- DTO validation with descriptive error messages
- Clear HTTP semantics (400 for validation, 404 for missing resources)
- Swagger as source of truth
- Global exception filter for consistent error response shape:
  ```json
  { "statusCode": 400, "timestamp": "...", "path": "/...", "method": "GET", "message": "..." }
  ```
- API is designed so that frontend can start immediately and other consumers could reuse it later

---

## 11. Implementation Progress

### Backend — ✅ MVP Complete

| Step | Status | Description |
|------|--------|-------------|
| App bootstrap | ✅ | NestJS scaffold, Swagger, ConfigModule |
| Prisma integration | ✅ | Schema, connection, PrismaModule (global) |
| Migrations & seed | ✅ | 4 migrations, seed with 12 teams, 12 matches, 48 players, events, lineups |
| Read endpoints | ✅ | `/league`, `/teams`, `/matches`, `/players`, `/standings`, `/stats`, `/health` |
| Standings computation | ✅ | Correct sorting, includes 0-match teams, unit tested |
| Match detail | ✅ | Events (goals/cards/subs) with assist & substitution details, lineups |
| Stats computation | ✅ | `GET /stats` — top scorers, assists, cards, clean sheets from MatchEvent aggregation |
| Scoring engine | ✅ | Goals, assists, clean sheets, cards, captain 2×, vice-captain auto-promotion, per-player breakdown |
| Admin scoring trigger | ✅ | `POST /fantasy/score-round` with API key guard |
| Squad lock | ✅ | Prevents pick changes during live matches |
| Error handling | ✅ | Global exception filter, DTO validation |

### Frontend — ✅ MVP Complete

| Step | Status | Description |
|------|--------|-------------|
| App shell + routing | ✅ | Lazy-loaded, responsive layout, adaptive home redirect |
| API integration | ✅ | Services with caching, environment-based API URL |
| Home dashboard | ✅ | Matchweek fixtures, top 5 standings, quick links |
| Matches page | ✅ | Round selector, match list with date grouping |
| Match detail | ✅ | Events timeline (home/away columns), lineups (starters/bench) |
| Standings | ✅ | Full table, form guide, position change, short/full toggle |
| Team detail | ✅ | Team info, recent matches |
| i18n | ✅ | 3 languages with persistent selection |
| Stats page | ✅ | Tabbed leaderboards — scorers, assists, yellow/red cards, clean sheets |
| Auth page | ✅ | Login & register with client-side validation, password confirmation |
| Fantasy dashboard | ✅ | Team creation, squad overview with formation bar, leaderboard with medals |
| Squad builder | ✅ | Two-panel UI: selected squad (captain/VC/remove) + player pool (position/team/search filter, budget tracking) |
| Gameweek history | ✅ | Expandable per-round view with per-player point breakdowns |
| Fantasy sub-nav | ✅ | Layout header shows fantasy navigation when on fantasy routes |

---

## 12. Comprehensive Review

### What's Working Well

1. **Clean architecture** — Clear module boundaries (NestJS modules, Angular standalone components), each domain has its own module/service/controller
2. **Type safety** — Prisma-generated types on backend, explicit interfaces on frontend, TypeScript strict mode
3. **Computed standings** — Correct football sorting rules, tested with edge cases, no stale aggregates
4. **Responsive design** — Mobile-first approach with adaptive navigation and layout
5. **i18n from day one** — Trilingual support baked into the initial build
6. **Seed data quality** — Realistic Kazakh football data (real team names, cities) with varied match states
7. **OnPush + Signals** — Modern Angular patterns used consistently across all components
8. **Error handling** — Global filter on backend, loading/error/empty states on frontend

### What's Missing

1. **Teams list page** — `TeamsComponent` exists but is not routed (no `/teams` in route table)
2. **Player profiles** — `/players/:id` endpoint exists but no frontend page for it
3. **Gameweek history UI** — ~~Backend supports it, no frontend page yet~~ ✅ Implemented: expandable round list with per-player scoring breakdown
4. **Transfer window logic** — ~~Squad editing is open-ended; no transfer windows~~ Partially resolved: squad changes are now blocked during live matches; per-gameweek transfer limits are still not implemented
5. **Live polling** — Strategy defined but not implemented (no interval-based data refresh)
6. **Tests** — Only standings utility has meaningful unit tests; `app.spec.ts` is outdated/broken
7. **CI/CD** — No GitHub Actions workflows
8. **Shared packages** — `packages/` directory referenced but does not exist; DTOs duplicated between FE/BE
9. **PWA** — Mentioned in vision but no service worker or manifest configured
10. **News aggregation** — Planned but not started
11. **Pagination** — No endpoints support pagination; will become a problem at scale

### What Can Be Improved

1. **Duplicate code** — `MatchesHomeComponent` and `HomeComponent` are near-identical; `TeamsService.getLeague()` duplicates `LeagueService.getLeague()`
2. **Route organization** — The root redirect uses `window.innerWidth` at route-resolution time (not reactive to resize); `HomeComponent` exists but isn't used
3. **Caching** — Manual `Map + shareReplay` pattern is repeated in every service; could be a reusable utility or interceptor
4. **Error recovery** — Cache entries are deleted on error, but there's no retry logic or user-facing retry button
5. **Test coverage** — Only `standings.utils.spec.ts` has real tests; frontend test setup exists (Vitest) but is unused
6. **Shared types** — Frontend `api.interfaces.ts` and backend Prisma types are manually kept in sync; should create `packages/shared`
7. **API response typing** — Backend returns raw Prisma objects; explicit response DTOs would improve API contract stability
8. **Bundle size monitoring** — Production budgets configured but no actual production build pipeline
9. **Accessibility** — Basic focus styles exist but no ARIA labels on interactive elements, no skip navigation link
10. **SEO** — SPA with no SSR or prerendering; important pages won't be indexed well

### Potential Drawbacks

1. **Manual data entry** — All match data is entered through Supabase UI; this doesn't scale beyond a few games per week and is error-prone
2. ~~**No authentication**~~ — ✅ Resolved: JWT auth implemented with bcrypt password hashing
3. **Supabase dependency** — While Prisma abstracts the DB, connection pooling, direct URL patterns, and deployment are Supabase-specific
4. **No pagination** — As data grows (multiple seasons, all players, all events), unbounded queries will degrade performance
5. **Client-side standings computation** — The `Standings` page recomputes standings locally for "position change" arrows, duplicating backend logic; if rules change, both must be updated
6. **No API versioning** — Breaking changes to response shapes will affect all consumers
7. **Capacitor not configured** — Mobile strategy is planned but no Capacitor config, plugins, or native builds exist
8. **i18n translation completeness** — All three language files must stay in sync manually; no validation tooling

---

## 13. Next Development Steps

### ✅ League Statistics (Phase 2 — Complete)

The stats feature is fully implemented across backend and frontend.

#### Backend — `GET /stats?competition=<code>`

- **StatsModule** (controller + service) with `GetStatsDto` validation (defaults to `kpl`)
- Aggregates `MatchEvent` data using Prisma `groupBy` queries (top 20 per category)
- **Top scorers**: goals grouped by `playerId`
- **Top assists**: events grouped by `assistPlayerId`
- **Yellow/red cards**: events grouped by `playerId` filtered by type
- **Clean sheets**: goalkeeper-level tracking — finds GK from `MatchLineup`, counts matches where opponent scored 0
- Response includes `playerName`, `teamName`, `teamShortName`, and `count` for each entry
- Swagger-documented

#### Frontend — Stats Page

- **StatsService** with `getStats(competition)` method and `shareReplay` caching
- **StatsComponent**: 5-tab leaderboard (Scorers, Assists, Yellow Cards, Red Cards, Clean Sheets)
- Signal-based state with `computed()` to derive active tab rows
- Medal emojis (🥇🥈🥉) for top 3 in each category
- Team names link to `/teams/:id`
- Loading/error/empty states
- Mobile-responsive at 500px breakpoint
- **Dashboard integration**: `MatchesHome` shows top 3 scorers mini-card
- i18n keys added to all 3 languages (EN, KK, RU)

---

### ✅ Fantasy Football (Phase 3 — Complete)

The fantasy football feature is fully implemented across backend and frontend.

#### Database schema (implemented)

5th migration (`20260225171316_fantasy_models`) added:
- **User** — email (unique), displayName, passwordHash (bcrypt)
- **FantasyTeam** — userId, competitionId, name, budget (100.0 default), totalPoints; unique (userId, competitionId)
- **FantasyPick** — fantasyTeamId, playerId, position (GK/DF/MF/FW enum), isCaptain, isViceCaptain; unique (fantasyTeamId, playerId)
- **FantasyGameweek** — fantasyTeamId, round, points; unique (fantasyTeamId, round)
- Extended **Player** with `price` field (Float?)
- Position-based pricing in seed: GK 4.0-5.0, DF 4.5-5.5, MF 5.0-7.0, FW 6.0-8.0 (with top-team bonus)

#### Scoring rules (implemented)

| Event | Points |
|-------|--------|
| Starter (60+ min) | 2 |
| Substitute (1-59 min) | 1 |
| Goal (FW) | 4 |
| Goal (MF) | 5 |
| Goal (DF/GK) | 6 |
| Assist | 3 |
| Clean sheet (DF/GK) | 4 |
| Clean sheet (MF) | 1 |
| Yellow card | -1 |
| Red card | -3 |
| Captain | 2× total points |

#### Backend implementation (complete)

1. **AuthModule** (`apps/api/src/auth/`):
   - `POST /auth/register` — create user with bcrypt-hashed password, returns JWT
   - `POST /auth/login` — validate credentials, return JWT
   - `GET /auth/profile` — 🔐 current user info (JWT guard)
   - JWT strategy via passport-jwt, 7-day token expiry
   - `@CurrentUser()` decorator for extracting user from request

2. **FantasyModule** (`apps/api/src/fantasy/`):
   - `POST /fantasy/teams` — 🔐 create fantasy team (name + competition)
   - `GET /fantasy/my-team` — 🔐 current user's team with picks
   - `PUT /fantasy/teams/:id/picks` — 🔐 update squad picks with full validation:
     - Budget check (total price ≤ team budget)
     - Position limits (2 GK, 5 DF, 5 MF, 3 FW = 15 players)
     - Max 3 players from same real team
     - Exactly 1 captain, at most 1 vice-captain
   - `GET /fantasy/leaderboard` — global ranking by totalPoints
   - `GET /fantasy/players` — available players with prices
   - `GET /fantasy/teams/:id` — view any team detail
   - `GET /fantasy/teams/:id/gameweeks` — gameweek history
   - `GET /fantasy/teams/:id/gameweeks/:round/players` — per-player point breakdown for a gameweek
   - `POST /fantasy/score-round` — 🔐 admin-only endpoint (x-admin-key header) to trigger scoring for a round
   - **ScoringService**: calculates player points from MatchEvent/MatchLineup data, applies captain 2× multiplier, vice-captain auto-promotion (if captain didn't play, VC gets 2×)
   - **AdminKeyGuard**: API-key guard for admin endpoints (checks `x-admin-key` header against `ADMIN_API_KEY` env var)
   - **Squad lock**: prevents pick changes while any match in the competition has `status=live`

#### Frontend implementation (complete)

1. **Auth page** (`/auth`) — Login/Register toggle with signal-based form state:
   - Email, password, confirm password, display name fields
   - Real-time `computed()` validation (format, length, match)
   - JWT token stored in localStorage, `AuthService` manages state

2. **Fantasy dashboard** (`/fantasy`) — `FantasyHome` component:
   - Team creation flow (name input + create button)
   - Squad summary: formation bar (GK/DF/MF/FW counts), budget display, total points
   - Leaderboard table with 🥇🥈🥉 medals for top 3
   - "Edit Squad" navigation to squad builder

3. **Squad builder** (`/fantasy/squad`) — `FantasySquad` two-panel component:
   - **Left panel**: Selected squad grouped by position, captain/VC badge toggling, remove player
   - **Right panel**: Available player pool with 3 filter dimensions:
     - Position filter (All/GK/DF/MF/FW tabs)
     - Team filter (dropdown of all available teams)
     - Text search (name matching)
   - Budget tracker: remaining budget, per-player price display
   - Save picks button with full validation mirroring backend rules

4. **Gameweek history page** (`/fantasy/gameweeks/:id`) — `FantasyGameweeks` component:
   - Expandable round list showing points per gameweek
   - Clicking a round expands to show per-player breakdown table
   - Each player row shows: position badge, name, captain/VC indicator, breakdown chips (appearance, goals, assists, clean sheet, cards), multiplier, total points
   - Footer row with gameweek total
   - Responsive: breakdown chips hidden on mobile

5. **Fantasy sub-navigation**: Layout component shows fantasy nav links when on `/fantasy` routes

5. **i18n**: Full fantasy & auth translation keys in EN, KK, RU (80+ new keys)

---

## 14. News & Content Strategy (Planned — Phase 5)

- News aggregation via links (Telegram, websites)
- No content scraping
- Attribution-first approach
- Possible Telegram aggregator channel controlled by the project

---

## 15. Key Architectural Decisions (Why They Matter)

| Decision | Rationale |
|----------|-----------|
| Monorepo (pnpm) | Faster iteration, shared tooling |
| Prisma ORM | Long-term schema safety, generated types |
| Supabase | Operational simplicity, no DevOps overhead |
| Manual live updates | Reliability over real-time (no live API for KPL) |
| Computed standings | Correctness, no stale aggregates |
| API-first | Frontend freedom, multi-platform support |
| Standalone components | Modern Angular, no NgModule boilerplate |
| OnPush + Signals | Performance, predictable change detection |
| i18n from start | Kazakhstan is multilingual (Kazakh, Russian, English) |

---

## 16. Current State Summary

The project has evolved from idea to a **feature-rich platform** with a fully working **read API**, **JWT authentication**, and **fantasy football** system across backend and frontend. The system provides a usable UI for core browsing flows, personalized fantasy team management, and trilingual support.

### What's solid
- REST API with 20+ endpoints (public league data + authenticated fantasy CRUD)
- JWT authentication with bcrypt password hashing
- Fantasy football: team creation, squad builder with full validation, leaderboard, scoring engine
- Computed standings with correct football rules (tested)
- League statistics: 5 leaderboard categories with Prisma `groupBy` aggregates
- Responsive SPA with adaptive mobile/desktop navigation
- Match detail with events & lineups
- Stats page with 5-tab leaderboard and dashboard integration
- Auth page with real-time signal-based validation
- Trilingual i18n (80+ fantasy/auth keys added)
- Realistic seed data with position-based player pricing

### What needs attention next
1. **Transfer limits** — squad editing is blocked during live matches but there are no per-gameweek free transfer limits
2. **Technical debt** — duplicate components, missing tests, broken app.spec.ts, `packages/` directory doesn't exist
3. **Teams page routing** — component exists but isn't accessible
4. **Player profiles** — endpoint exists, frontend page doesn't
5. **Live polling** — strategy defined but not implemented

The next logical phase is **Phase 4 (Admin & Live)**, with ongoing cleanup of technical debt.

