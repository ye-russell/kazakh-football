# Kazakh Football

**Kazakh Football** is an independent, community-driven platform that provides structured football data and news aggregation for Kazakhstan football competitions.

The project starts with a **clean, reliable data layer** (fixtures, results, standings) and is designed to evolve into a **full football hub** including news aggregation, notifications, and fantasy features.

> ⚠️ This project is **not affiliated with**, **endorsed by**, or **sponsored by** the Kazakhstan Football Federation (KFF) or any football club.

---

## 🎯 Goals

- Provide a **modern, reliable source of football data** for Kazakhstan leagues
- Offer a **simple and fast API** for standings, matches, and teams
- Enable **web + mobile apps** from a single backend
- Lay a solid foundation for:
  - news aggregation (Telegram / websites)
  - push notifications
  - fantasy football
  - premium features

---

## 🧩 Scope (MVP)

### Supported competitions
- Kazakhstan Premier League (KPL)
- First League (planned / optional)

### MVP features
- League metadata (season, competitions)
- Teams
- Matches (by competition and round)
- Automatically computed standings

❌ No authentication  
❌ No write endpoints  
❌ No logos or trademarks  

---

## 🏗️ Architecture

```
Angular / PWA / Mobile
        ↓
     REST API
        ↓
   NestJS (TypeScript)
        ↓
   PostgreSQL (Supabase)
```

---

## 🧪 Technology Stack

### Backend
- Node.js 20+
- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL (Supabase)
- Swagger / OpenAPI

### Database
- Managed PostgreSQL via Supabase
- No proprietary extensions
- Standings are **computed**, not stored

### Tooling
- pnpm
- ESLint
- class-validator
- GitHub Actions (planned)

---

## 📡 API (Read-only)

### Endpoints
```
GET /league
GET /teams
GET /matches?competition=kpl&round=1
GET /standings?competition=kpl
```

### Standings rules
- Only finished matches are considered
- Points: win = 3, draw = 1, loss = 0
- Sorting:
  1. points (desc)
  2. goal difference (desc)
  3. goals scored (desc)
  4. team name (asc)

---

## 📊 Data Philosophy

- Match results and standings are **factual data**
- No copyrighted media is stored
- No club or league logos are included
- News (future) will be **linked, not copied**

This keeps the project:
- legally safe
- easy to maintain
- community-friendly

---

## 🔐 Security & Access

- Public read-only API
- No authentication in v1
- No secrets committed to the repository
- Environment variables managed externally

---

## 🚀 Getting Started

### Requirements
- Node.js 20+
- pnpm
- PostgreSQL (local or Supabase)

### Setup
```bash
pnpm install
pnpm prisma migrate dev
pnpm prisma db seed
pnpm dev
```

### Environment variables
Create `.env`:
```env
DATABASE_URL=postgresql://...
PORT=3000
```

Swagger UI will be available at:
```
http://localhost:3000/docs
```

---

## 🛣 Roadmap

### Phase 1 — Data Platform (current)
- Stable API
- Standings computation
- Public release

### Phase 2 — News Aggregation
- Telegram & website links
- Source attribution
- Outbound traffic only

### Phase 3 — Mobile Experience
- PWA
- Android & iOS (Capacitor)

### Phase 4 — Advanced Features
- Push notifications
- User preferences
- Fantasy football
- Premium subscriptions

---

## 🤝 Contributing

Contributions are welcome:
- bug fixes
- improvements
- additional competitions
- documentation

Please open an issue or pull request.

---

## 📄 License

MIT License.

---

## ⚖️ Disclaimer

This is an independent project created for educational and community purposes.  
All trademarks, club names, and competition names belong to their respective owners.

