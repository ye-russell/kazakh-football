# Kazakh Football App – Deep Technical & Product Summary

## 1. Product Vision

The goal of the **Kazakh Football** app is to create a modern, reliable, and extensible digital platform for football competitions in Kazakhstan, starting with the **Kazakhstan Premier League (KPL)** and later expanding to:
- First League
- Player information
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
- **Single frontend codebase** (Angular PWA)
- Wrapped for mobile stores via **Capacitor**
- Backend-first development to stabilize data contracts

---

## 3. Monorepo Structure

The project is implemented as a **pnpm monorepo**:

```
kazakh-football/
  apps/
    api/        # NestJS backend
    web/        # Angular frontend (planned)
  packages/     # Shared DTOs / types (planned)
```

Benefits:
- Shared types between FE and BE
- Unified CI/CD
- Easier refactoring early in the project lifecycle

---

## 4. Backend Architecture

### Stack
- **Node.js 20+**
- **NestJS** (REST API)
- **TypeScript**
- **Prisma ORM (v5.x)**
- **PostgreSQL (Supabase)**
- **Swagger / OpenAPI**

### Backend philosophy
- Read-heavy API
- Computed data (standings) instead of stored aggregates
- Clear separation of concerns (modules per domain)
- Versionable and reusable API (potential public usage later)

---

## 5. Database Strategy

### Why Supabase
- Managed PostgreSQL
- Reliable cloud hosting
- Built-in DB UI (admin & manual updates)
- Easy future expansion (auth, storage)

Supabase is used **only as a database** at this stage; Prisma is the data access layer.

### ORM: Prisma
- Schema-first design
- Type-safe DB access
- Predictable migrations
- Strong tooling (Prisma Studio, seed scripts)

---

## 6. Data Model (Current)

### Core entities

**Competition**
- id
- code (kpl, first)
- name
- season

**Team**
- id
- name (unique)
- shortName
- city (optional)
- logoUrl (optional)

**Match**
- id
- competitionId
- round
- kickoffAt
- status (scheduled | live | finished)
- homeTeamId
- awayTeamId
- homeScore (nullable)
- awayScore (nullable)

**Player**
- id
- teamId
- name
- number (optional)
- position (optional)

**MatchEvent**
- id
- matchId
- teamId
- playerId
- type (goal | yellow_card | red_card | substitution)
- minute (+ optional extraMinute)
- assistPlayerId (optional)
- subInPlayerId (optional)
- subOutPlayerId (optional)

**MatchLineup**
- id
- matchId
- teamId
- playerId
- isStarter
- position (optional)

Indexes are defined for efficient querying by competition, round, kickoff time, and teams.
Constraint: homeTeamId != awayTeamId (prevents a team from playing itself).

---

## 7. Live Matches Strategy

### Chosen level: Level 1 Live

Live is defined as:
- Match status updates (scheduled → live → finished)
- Score updates

No minute-by-minute events initially.

### Update mechanism
- Manual updates via Supabase UI (human-in-the-loop)
- Frontend polling every 30–60 seconds

Reasoning:
- No reliable KPL live data API
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

## 9. Backend Implementation Progress

### Completed steps

**Step 1 – App Bootstrap**
- NestJS scaffold
- Swagger at /docs
- ConfigModule

**Step 2 – Prisma Integration**
- Prisma schema
- PostgreSQL connection
- PrismaModule

**Step 3 – Migrations & Seed**
- Database migrated successfully
- Seed script implemented and run
- Real competitions, teams, matches created
- Match constraint added (homeTeamId != awayTeamId)

**Step 4 – Read Endpoints**
- GET /league
- GET /teams
- GET /matches

**Step 5 – Standings**
- GET /standings
- Computed from finished matches
- Correct football sorting rules
- Later enhanced to include all teams (even with 0 matches)

**Additional endpoints added**
- GET /teams/:id
- GET /matches/:id
- GET /players
- GET /players/:id
- GET /health

Backend MVP is functionally complete.

---

## 10. API Design Principles

- Read-only by default
- Deterministic responses
- DTO validation
- Clear HTTP semantics (400 / 404)
- Swagger as source of truth
- Global exception filter for consistent error responses

API is designed so that:
- Frontend can start immediately
- Other consumers could reuse it later

---

## 11. Frontend Readiness

### Backend readiness
- ✅ DB accessible
- ✅ Stable endpoints
- ✅ Seeded realistic data
- ✅ CORS enabled for frontend integration
- ⚠️ Missing matchweek metadata (max round) for frontend matchweek selector

Frontend is now implemented with a responsive UI and basic functionality, using the stable API.

### Frontend stack (current)
- Angular (latest stable)
- Standalone components
- Signals
- PWA
- Capacitor for Android/iOS

### Frontend features (implemented)
- App shell + routing
- Environment config for API base URL
- API client + domain services
- Responsive layout (mobile-first)
- Home page (matchweek fixtures, standings snapshot, quick links, stats placeholder)
- Standings page
- Matches list with matchweek navigation
- Match detail page
- Match detail includes events, assists, substitutions, and starting lineups
- Teams list with search
- Team detail page with recent matches

---

## 12. News & Content Strategy (Planned)

- News aggregation via links (Telegram, websites)
- No content scraping
- Attribution-first approach
- Possible Telegram aggregator channel controlled by the project

---

## 13. Future Roadmap

Short-term:
- Frontend MVP
- Basic navigation
- Polling-based live updates
- Player and match event UI polish

Mid-term:
- Player profiles
- Transfers with historical contracts
- News feed
- Push notifications

Long-term:
- Fantasy football
- Public API tiers
- Partnerships

---

## 14. Key Architectural Decisions (Why They Matter)

- Monorepo → faster iteration
- Prisma → long-term schema safety
- Supabase → operational simplicity
- Manual live updates → reliability
- Computed standings → correctness
- API-first → frontend freedom

---

## 15. Current State Summary

The project has successfully transitioned from idea to a **working backend platform** and a **functional, responsive web frontend**. The hardest technical risks (DB, schema, migrations, connectivity) are resolved. The system now provides a usable UI for core browsing flows.

The next logical phase is **frontend polish + product depth** (live updates, matchweek metadata, event timelines, UX refinements), not more backend plumbing.

