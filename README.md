# Kazakh Football

**Kazakh Football** is an independent, community-driven platform that provides structured football data and a modern web experience for Kazakhstan football competitions.

The project starts with a **clean, reliable data layer** (fixtures, results, standings) and is designed to evolve into a **full football hub** including league statistics, news aggregation, notifications, and fantasy features.

> ⚠️ This project is **not affiliated with**, **endorsed by**, or **sponsored by** the Kazakhstan Football Federation (KFF) or any football club.

---

## 🎯 Goals

- Provide a **modern, reliable source of football data** for Kazakhstan leagues
- Offer a **simple and fast API** for standings, matches, teams, players, and statistics
- Enable **web + mobile apps** from a single backend
- Lay a solid foundation for:
  - fantasy football
  - news aggregation (Telegram / websites)
  - push notifications
  - premium features

---

## 🧩 Current Scope

### Supported competitions
- Kazakhstan Premier League (KPL)
- First League (schema ready, data planned)

### Implemented features

#### Backend (NestJS REST API)
- League metadata (season, competitions, current/max round)
- Teams CRUD (list + detail)
- Matches with filtering by competition & round, full detail with events & lineups
- Players with team filtering and fantasy pricing
- Computed standings (points, GD, GF/GA, W/D/L)
- League statistics: top scorers, assists, yellow/red cards, clean sheets (Prisma `groupBy` aggregates)
- **Authentication**: JWT-based registration & login (bcrypt password hashing, passport-jwt strategy)
- **Fantasy Football**: Team creation, squad pick management (budget/position/team-count validation), leaderboard, gameweek scoring engine
- Health check endpoint (DB connectivity)
- Global exception filter with consistent error shape
- Swagger / OpenAPI documentation at `/docs` (with Bearer auth)
- Prisma ORM with migrations & seed data (12 teams, 12 matches, 48 players with fantasy prices, events, lineups)

#### Frontend (Angular 21 SPA)
- Responsive mobile-first layout with sticky header & bottom nav
- Home dashboard (matchweek fixtures, top 5 standings, quick links)
- Matches page with matchweek round selector
- Match detail page (events timeline, lineups — starters & bench)
- Standings page (full table, form guide, position change arrows, short/full toggle)
- Team detail page (info + recent matches)
- Stats page (5-tab leaderboard: scorers, assists, yellow cards, red cards, clean sheets)
- Top scorer mini-card in home dashboard
- **Auth page**: Login & registration with client-side validation, password confirmation
- **Fantasy dashboard**: Team creation, squad overview with formation bar, leaderboard with medals
- **Squad builder**: Two-panel UI — selected squad (captain/VC/remove) + available players (position filter, team filter, search, budget tracking)
- Fantasy sub-navigation in layout header
- Trilingual i18n (English, Kazakh, Russian)
- `OnPush` change detection on all components
- Signal-based state management
- Lazy-loaded routes

#### Not yet implemented
❌ Write endpoints / admin panel  
❌ Push notifications  
❌ Teams list page (component exists, not routed)  
❌ Player profile pages  
❌ News aggregation  
❌ Gameweek history UI  
❌ Transfer window logic  

---

## 🏗️ Architecture

```
kazakh-football/                    ← pnpm monorepo root
├── apps/
│   ├── api/                        ← NestJS REST API (Node.js 20+)
│   │   ├── prisma/                 ← Schema, migrations, seed
│   │   └── src/
│   │       ├── common/filters/     ← Global HTTP exception filter
│   │       ├── prisma/             ← PrismaModule (global)
│   │       ├── health/             ← GET /health
│   │       ├── league/             ← GET /league
│   │       ├── teams/              ← GET /teams, /teams/:id
│   │       ├── matches/            ← GET /matches, /matches/:id
│   │       ├── standings/          ← GET /standings (computed)
│   │       ├── stats/              ← GET /stats (aggregated leaderboards)
│   │       ├── players/            ← GET /players, /players/:id
│   │       ├── auth/               ← POST /auth/register, /auth/login, GET /auth/profile
│   │       └── fantasy/            ← Fantasy team CRUD, picks, leaderboard, scoring
│   └── web/                        ← Angular 21 SPA
│       └── src/app/
│           ├── core/layout/        ← App shell (header, nav, sub-nav)
│           ├── pages/              ← 10 routed page components (lazy-loaded)
│           │   ├── matches-home/   ← Desktop dashboard (fixtures, standings, top scorer)
│           │   ├── matches/        ← Full match list + round selector
│           │   ├── match-detail/   ← Single match view
│           │   ├── standings/      ← League table
│           │   ├── team-detail/    ← Individual team page
│           │   ├── stats/          ← 5-tab statistical leaderboards
│           │   ├── auth/           ← Login / Register
│           │   ├── fantasy-home/   ← Fantasy dashboard & leaderboard
│           │   └── fantasy-squad/  ← Squad builder (pick players, captain, budget)
│           └── shared/
│               ├── components/     ← MatchList, MatchweekSelector, LanguageSwitcher
│               ├── interfaces/     ← API type definitions
│               └── services/       ← API client, league, matches, standings, teams, stats, auth, fantasy
└── packages/                       ← Shared types / contracts (planned)
```

### Data flow
```
Angular SPA  →  HTTP (REST)  →  NestJS API  →  Prisma ORM  →  PostgreSQL (Supabase)
    ↑                                                              ↑
 Signals + OnPush                                          Managed cloud DB
 @ngx-translate (i18n)                                     Human-in-the-loop updates
 JWT token (localStorage)                                  Fantasy data stored alongside match data
```

---

## 🧪 Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Monorepo** | pnpm workspaces | Single repo, shared deps |
| **Frontend** | Angular 21.1 | Standalone components, signals, OnPush, lazy routes |
| **Styling** | Plain CSS | Custom properties (design tokens), mobile-first |
| **i18n** | @ngx-translate/core v17 | EN / KK / RU, JSON-based |
| **Testing (FE)** | Vitest + jsdom | Via `@angular/build:unit-test` |
| **Backend** | NestJS 11 | REST API, Swagger, class-validator |
| **Auth** | @nestjs/jwt + passport-jwt | JWT tokens, bcrypt password hashing |
| **ORM** | Prisma v5 | Schema-first, type-safe, migrations |
| **Database** | PostgreSQL | Supabase (managed), no vendor lock-in |
| **Testing (BE)** | Jest 30 | ts-jest, supertest for e2e |
| **Tooling** | ESLint, tsx, TypeScript 5.9 | |

---

## 📡 API Reference

### Public endpoints (no auth)

| Method | Endpoint | Query Params | Description |
|--------|----------|-------------|-------------|
| `GET` | `/` | — | Hello world |
| `GET` | `/health` | — | DB connectivity check |
| `GET` | `/league` | — | Competitions with `currentRound` / `maxRound` |
| `GET` | `/teams` | — | All teams (ordered by name) |
| `GET` | `/teams/:id` | — | Single team detail |
| `GET` | `/matches` | `competition`, `round?` | Matches filtered by competition & round |
| `GET` | `/matches/:id` | — | Match detail + events + lineups |
| `GET` | `/standings` | `competition` | Computed league table |
| `GET` | `/players` | `teamId?` | Players, optionally filtered by team |
| `GET` | `/players/:id` | — | Single player detail |
| `GET` | `/stats` | `competition?` | Top scorers, assists, cards, clean sheets |
| `GET` | `/fantasy/leaderboard` | `competition?` | Fantasy leaderboard |
| `GET` | `/fantasy/players` | `competition?` | Available players with prices |
| `GET` | `/fantasy/teams/:id` | — | View any fantasy team |
| `GET` | `/fantasy/teams/:id/gameweeks` | — | Gameweek points history |

### Auth endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register new user (email, password, displayName) |
| `POST` | `/auth/login` | Login with email & password, returns JWT |
| `GET` | `/auth/profile` | 🔒 Current user profile |

### Protected fantasy endpoints (Bearer token required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/fantasy/my-team` | 🔒 Current user's fantasy team |
| `POST` | `/fantasy/teams` | 🔒 Create fantasy team |
| `PUT` | `/fantasy/teams/:id/picks` | 🔒 Update squad picks (validates budget, positions, captain) |

### Standings computation rules
- Only finished matches are considered
- Points: win = 3, draw = 1, loss = 0
- Sorting: points (desc) → goal difference (desc) → goals scored (desc) → team name (asc)

### Error response shape
```json
{
  "statusCode": 400,
  "timestamp": "2026-02-22T12:00:00.000Z",
  "path": "/standings",
  "method": "GET",
  "message": "competition must be a string"
}
```

---

## 📊 Data Model

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

Key constraints:
- `homeTeamId ≠ awayTeamId` (database-level)
- `(matchId, playerId)` unique on lineups
- `(userId, competitionId)` unique on fantasy teams
- `(fantasyTeamId, playerId)` unique on picks
- `(fantasyTeamId, round)` unique on gameweeks
- Cascade delete: Match → Events & Lineups
- Indexes on all foreign keys + `(competitionId, round)`, `(competitionId, kickoffAt)`, `status`

---

## 📊 Data Philosophy

- Match results and standings are **factual data**
- No copyrighted media is stored
- No club or league logos are included
- News (future) will be **linked, not copied**

This keeps the project legally safe, easy to maintain, and community-friendly.

---

## 🔐 Security & Access

- Public read-only API for league data
- JWT authentication for fantasy features (Bearer token)
- Passwords hashed with bcrypt (10 rounds)
- Token expiry: 7 days
- No secrets committed to the repository
- Environment variables managed externally
- CORS enabled globally

---

## 🚀 Getting Started

### Requirements
- Node.js 20+
- pnpm 10+
- PostgreSQL (local or Supabase)

### Monorepo setup
```bash
pnpm install
```

### Backend (apps/api)
```bash
# Run migrations
pnpm --filter api prisma:migrate

# Seed sample data (12 teams, 12 matches, 48 players, events, lineups)
pnpm --filter api prisma:seed

# Start dev server (port 3000)
pnpm --filter api start:dev
```

### Frontend (apps/web)
```bash
# Start dev server (port 4200)
pnpm --filter web start
```

### Environment variables
Create `.env` inside `apps/api`:
```env
DATABASE_URL=postgresql://...      # pooler connection string
DIRECT_URL=postgresql://...        # direct connection (for migrations/seeds)
PORT=3000
HOST=0.0.0.0
JWT_SECRET=your-secret-key         # required for auth
```

Swagger UI: [http://localhost:3000/docs](http://localhost:3000/docs)  
Web app: [http://localhost:4200](http://localhost:4200)

---

## 🛣 Roadmap

### Phase 1 — Data Platform + Web MVP ✅ (complete)
- [x] Stable read-only API (league, teams, matches, standings, players)
- [x] Computed standings with proper football sorting
- [x] Match events & lineups
- [x] Responsive web UI (home, matches, standings, match detail, team detail)
- [x] Trilingual i18n (EN/KK/RU)
- [x] Seed data for development

### Phase 2 — League Statistics ✅ (complete)
- [x] **Backend**: `GET /stats?competition=kpl` — StatsModule with Prisma `groupBy` aggregates
- [x] **Backend**: Top scorers, assists, yellow/red cards (from `MatchEvent`), clean sheets (from `Match`)
- [x] **Frontend**: Stats page with 5-tab leaderboard (medals, team links, mobile-ready)
- [x] **Frontend**: Top scorer mini-card in home dashboard
- [x] **i18n**: Stats keys in EN, KK, RU

### Phase 3 — Fantasy Football ✅ (complete)
- [x] **Database**: Fantasy schema (User, FantasyTeam, FantasyPick, FantasyGameweek) + player pricing
- [x] **Backend**: JWT authentication (register, login, profile)
- [x] **Backend**: Fantasy CRUD endpoints (create team, update picks with full validation, leaderboard)
- [x] **Backend**: Scoring engine (goals, assists, clean sheets, cards, captain 2×)
- [x] **Frontend**: Auth page — login/register with client-side validation & password confirmation
- [x] **Frontend**: Fantasy dashboard — team creation, squad overview, leaderboard
- [x] **Frontend**: Squad builder — two-panel UI with position/team/search filters, budget tracking, captain/VC selection
- [x] **Frontend**: Fantasy sub-navigation in layout
- [x] **i18n**: Full fantasy & auth translations in EN, KK, RU
- [x] **Seed**: Position-based player pricing with top-team bonus

### Phase 4 — Mobile Experience
- [ ] PWA manifest & service worker
- [ ] Android & iOS wrappers (Capacitor)
- [ ] Push notifications

### Phase 5 — Content & Community
- [ ] News aggregation (Telegram & website links, attribution-first)
- [ ] User preferences & settings
- [ ] Public API tiers
- [ ] Premium features & partnerships

---

## 🤝 Contributing

Contributions are welcome:
- Bug fixes
- Improvements
- Additional competitions
- Documentation
- Translations (i18n)

Please open an issue or pull request.

---

## 📄 License

MIT License.

---

## ⚖️ Disclaimer

This is an independent project created for educational and community purposes.  
All trademarks, club names, and competition names belong to their respective owners.

