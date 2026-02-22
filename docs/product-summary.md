# Kazakh Football App – Deep Technical & Product Summary

> Last updated: February 22, 2026

## 1. Product Vision

The goal of the **Kazakh Football** app is to create a modern, reliable, and extensible digital platform for football competitions in Kazakhstan, starting with the **Kazakhstan Premier League (KPL)** and later expanding to:
- First League
- League statistics (top scorers, assists, disciplinary)
- Player information & profiles
- Transfers
- News aggregation
- Fantasy football

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
│   │   ├── prisma/    # Schema, migrations (4), seed script
│   │   └── src/       # 8 domain modules + common filters
│   └── web/           # Angular 21 frontend
│       ├── public/    # i18n JSONs (en, kk, ru)
│       └── src/app/   # 7 routed pages, 3 shared components, 8 services
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
| Swagger | @nestjs/swagger | API documentation at `/docs` |
| class-validator | — | DTO validation |
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
└── PlayersModule      → GET /players, /players/:id
```

### Backend philosophy
- Read-heavy, read-only API (no write endpoints)
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

Team ──< Player (name, number, position)
```

### Core entities

| Entity | Key Fields | Notes |
|--------|-----------|-------|
| **Competition** | id, code (unique), name, season | KPL, First League |
| **Team** | id, name (unique), shortName, city?, logoUrl? | 12 teams seeded |
| **Match** | id, competitionId, round, kickoffAt, status, homeTeamId, awayTeamId, homeScore?, awayScore? | Constraint: home ≠ away |
| **Player** | id, teamId, name, number?, position? | 48 players seeded (4 per team) |
| **MatchEvent** | id, matchId, teamId, playerId, type, minute, extraMinute?, assistPlayerId?, subInPlayerId?, subOutPlayerId? | Cascade on match delete |
| **MatchLineup** | id, matchId, teamId, playerId, isStarter, position? | Unique (matchId, playerId), cascade on match delete |

### Enums
- **MatchStatus**: `scheduled`, `live`, `finished`
- **MatchEventType**: `goal`, `yellow_card`, `red_card`, `substitution`

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
| Layout | 1 | `Layout` (header, nav, sub-nav, responsive bottom bar) |
| Pages | 7 (routed) | `MatchesHome`, `Matches`, `MatchDetail`, `Standings`, `TeamDetail`, `Stats`, `FantasyHome` |
| Unrouted | 2 | `Home` (unused), `Teams` (exists, not routed) |
| Shared | 3 | `MatchList`, `MatchweekSelector`, `LanguageSwitcher` |
| Services | 8 | `ApiClient`, `LeagueService`, `MatchesService`, `StandingsService`, `TeamsService`, `StatsService`, `LanguageService`, `TranslateHttpLoader` |
| Interfaces | 1 file | 11 interfaces/types in `api.interfaces.ts` |

### Route table

| Path | Component | Notes |
|------|-----------|-------|
| `/` | redirect | → `/matches-home` (mobile ≤650px) or `/matches-home` (desktop) |
| `/matches-home` | `MatchesHome` | Desktop dashboard (fixtures, standings, top scorer) |
| `/matches` | `Matches` | Full match list + matchweek selector |
| `/matches/:id` | `MatchDetail` | Match events + lineups |
| `/standings` | `Standings` | Full league table |
| `/stats` | `Stats` | 5-tab leaderboard (scorers, assists, yellow cards, red cards, clean sheets) |
| `/fantasy` | `FantasyHome` | **Placeholder** — "Coming soon" |
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
| Fantasy | 🔲 | Placeholder only |

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

1. **Fantasy football** — Placeholder only; requires auth, new schema, scoring engine, squad builder
2. **Teams list page** — `TeamsComponent` exists but is not routed (no `/teams` in route table)
3. **Player profiles** — `/players/:id` endpoint exists but no frontend page for it
4. **Live polling** — Strategy defined but not implemented (no interval-based data refresh)
5. **Tests** — Only standings utility has meaningful unit tests; `app.spec.ts` is outdated/broken
6. **CI/CD** — No GitHub Actions workflows
7. **Shared packages** — `packages/` directory referenced but does not exist; DTOs duplicated between FE/BE
8. **PWA** — Mentioned in vision but no service worker or manifest configured
9. **News aggregation** — Planned but not started
10. **Pagination** — No endpoints support pagination; will become a problem at scale

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
2. **No authentication** — Fantasy football and any personalized features require auth; this is a significant architectural addition
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

### Step 1: Fantasy Football (Phase 3 — Next)

#### Database schema additions

```prisma
model User {
  id            String         @id @default(uuid())
  email         String         @unique
  displayName   String
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  fantasyTeams  FantasyTeam[]
}

model FantasyTeam {
  id            String               @id @default(uuid())
  userId        String
  user          User                 @relation(fields: [userId], references: [id])
  name          String
  competitionId String
  competition   Competition          @relation(fields: [competitionId], references: [id])
  budget        Float                @default(100.0)
  totalPoints   Int                  @default(0)
  createdAt     DateTime             @default(now())
  updatedAt     DateTime             @updatedAt
  picks         FantasyPick[]
  gameweeks     FantasyGameweek[]
}

model FantasyPick {
  id            String       @id @default(uuid())
  fantasyTeamId String
  fantasyTeam   FantasyTeam  @relation(fields: [fantasyTeamId], references: [id])
  playerId      String
  player        Player       @relation(fields: [playerId], references: [id])
  isCaptain     Boolean      @default(false)
  isViceCaptain Boolean      @default(false)
  position      String       // GK, DF, MF, FW
  createdAt     DateTime     @default(now())

  @@unique([fantasyTeamId, playerId])
}

model FantasyGameweek {
  id            String       @id @default(uuid())
  fantasyTeamId String
  fantasyTeam   FantasyTeam  @relation(fields: [fantasyTeamId], references: [id])
  round         Int
  points        Int          @default(0)
  createdAt     DateTime     @default(now())

  @@unique([fantasyTeamId, round])
}

// Extend Player model:
model Player {
  // ... existing fields ...
  price         Float?       // fantasy price
  fantasyPicks  FantasyPick[]
}
```

#### Scoring rules (proposed)

| Event | Points |
|-------|--------|
| Playing 1-59 min | 1 |
| Playing 60+ min | 2 |
| Goal (FW) | 4 |
| Goal (MF) | 5 |
| Goal (DF/GK) | 6 |
| Assist | 3 |
| Clean sheet (DF/GK) | 4 |
| Clean sheet (MF) | 1 |
| Yellow card | -1 |
| Red card | -3 |
| Own goal | -2 |
| Captain | 2× points |

#### Backend implementation plan
1. **Auth module**: JWT-based authentication (or Supabase Auth integration)
2. **Users module**: Registration, login, profile
3. **Fantasy module**:
   - `POST /fantasy/teams` — create fantasy team (with budget)
   - `GET /fantasy/teams/:id` — view fantasy team
   - `PUT /fantasy/teams/:id/picks` — set squad (validate budget, positions, max per team)
   - `GET /fantasy/leaderboard?competition=<code>` — global ranking
   - `GET /fantasy/gameweeks/:round` — points for a specific gameweek
4. **Scoring engine**: Background job or triggered after match finishes
   - Calculate points per player per gameweek based on MatchEvent data
   - Apply captain multiplier
   - Update FantasyGameweek and FantasyTeam.totalPoints

#### Frontend implementation plan
1. **Auth pages**: Login / Register (new routes)
2. **Fantasy hub** (`/fantasy`):
   - Dashboard: my team, current gameweek points, overall rank
   - Squad builder: pitch view, player list, budget tracker, position validation
   - Transfers: swap players within budget
   - Leaderboard: global ranking table
   - Gameweek history: points breakdown per round
3. **Player cards**: Reusable component showing player name, team, position, price, points
4. **i18n**: Add fantasy-related translations to all 3 languages

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

The project has successfully transitioned from idea to a **working backend platform** and a **functional, responsive web frontend**. The hardest technical risks (DB, schema, migrations, connectivity) are resolved. The system provides a usable UI for core browsing flows across 3 languages.

### What's solid
- Full read-only API with 11 endpoints (including stats aggregation)
- Computed standings with correct football rules (tested)
- League statistics: 5 leaderboard categories with Prisma `groupBy` aggregates
- Responsive SPA with adaptive mobile/desktop navigation
- Match detail with events & lineups
- Stats page with 5-tab leaderboard and dashboard integration
- Trilingual i18n
- Realistic seed data

### What needs attention next
1. **Fantasy football** — requires auth, new schema, scoring engine, and significant frontend work
2. **Technical debt** — duplicate components, missing tests, broken app.spec.ts, `packages/` directory doesn't exist
3. **Teams page routing** — component exists but isn't accessible
4. **Player profiles** — endpoint exists, frontend page doesn't
5. **Live polling** — strategy defined but not implemented

The next logical phase is **fantasy football (big feature)**, with ongoing cleanup of technical debt.

