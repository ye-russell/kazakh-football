# Deployment Readiness & Data Population Guide

> Last updated: February 25, 2026

## Deployment Readiness

### Status overview

| Area | Status | Blocker? |
|------|--------|----------|
| API + DB (Supabase) | ✅ Ready | No |
| Frontend SPA | ✅ Ready | No |
| Auth (JWT) | ✅ Working | No |
| Fantasy system | ✅ Working | No |
| Real match/team/player data | ❌ Missing | **Yes** |
| Environment config (production) | ⚠️ Needs setup | Yes |
| CORS / domain config | ⚠️ Not configured | Yes |
| Frontend hosting (Vercel/Netlify/CF Pages) | ⚠️ Not set up | Yes |
| API hosting (Railway/Render/Fly.io) | ⚠️ Not set up | Yes |
| CI/CD pipeline | ❌ Missing | No (can deploy manually) |
| Rate limiting / abuse protection | ❌ Missing | Recommended |

**Verdict:** Deploy once real data and hosting are configured. No code blockers.

---

## How to Populate Real KPL Data

The 2026 KPL season typically starts in **March**. Here's a practical plan:

### Step 1 — Teams (do once, ~30 min)

- Source: [PFLK.kz](https://pflk.kz) (official KPL site) or Transfermarkt Kazakhstan page
- Get all 12–14 teams: name, short name, city, logo URL
- Enter via **Supabase Table Editor** → `Team` table
- Or prepare a JSON/CSV and run a one-time seed script

### Step 2 — Players (do once per team, ~2-3 hours total)

- Source: Transfermarkt, Soccerway, or official club pages
- For each team: name, shirt number, position (GK/DF/MF/FW)
- **Fantasy prices** — assign manually based on reputation:
  - Top strikers/stars: 7.0–8.0M
  - Good midfielders: 5.5–7.0M
  - Solid defenders: 4.5–5.5M
  - Goalkeepers: 4.0–5.0M
  - Budget picks: 4.0–4.5M
- Tip: price all 15-squad spots so a valid team costs ~95–100M total
- Enter via Supabase or a seed script with a JSON file

### Step 3 — Competition record

- Create one row in `Competition`: `code=kpl`, `name=Kazakhstan Premier League`, `season=2026`
- Set `currentRound=1`, `maxRound` = total rounds (usually 22 or 33 depending on format)

### Step 4 — Match schedule (do once, ~1-2 hours)

- Source: PFLK.kz publishes the full fixture calendar before the season
- For each match: `competitionId`, `round`, `kickoffAt`, `homeTeamId`, `awayTeamId`, `status=scheduled`
- Leave `homeScore` and `awayScore` as `null`
- This gives you the entire season skeleton before a ball is kicked

### Step 5 — Ongoing match updates (during the season)

Each matchday (typically weekends):

1. When a match starts → set `status=live` in Supabase
2. When goals/cards happen → add rows to `MatchEvent` (type, minute, playerId, teamId)
3. After the match → add `MatchLineup` rows (starters + subs), set final score, set `status=finished`
4. Update `Competition.currentRound` after each round completes

**Time per matchday:** ~15–30 min if done manually right after matches end.

---

## How to Recalculate Fantasy Points

The scoring engine (`ScoringService`) already exists in code.

### Scoring rules

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

### After each round is complete

1. **Ensure all match data is entered** — scores, events (goals, assists, cards), lineups (who started, who was subbed in)
2. **Trigger scoring** — call the scoring endpoint or run the scoring service. It will:
   - Look at every fantasy team's picks for that round
   - For each picked player, scan `MatchEvent` and `MatchLineup` to calculate points
   - Apply captain 2× multiplier
   - Create/update `FantasyGameweek` record (team + round + points)
   - Update `FantasyTeam.totalPoints` (sum of all gameweeks)
3. **Leaderboard updates automatically** — it queries by `totalPoints DESC`

### Practical workflow per matchday

```
Friday/Saturday/Sunday:
  → Matches played
  → Enter results in Supabase (scores, events, lineups)

Sunday/Monday evening:
  → Trigger fantasy scoring for that round
  → Leaderboard refreshes
  → Users see updated points
```

### What's not yet automated

- **No automatic trigger** — manually call the scoring endpoint or add a button in an admin UI
- **No transfer deadline** — users can currently edit squads anytime (lock picks before kickoff is a future feature)
- Suggestion: add a simple admin-only `POST /fantasy/score-round?round=X` endpoint that triggers recalculation

---

## Recommended Launch Sequence

1. **Now:** Gather real team + player data, set fantasy prices
2. **1–2 weeks before season:** Seed teams, players, full fixture schedule. Deploy API + frontend
3. **Open registration:** Let users sign up and build fantasy squads
4. **Round 1 kickoff:** Lock squads (future feature), enter match results after games
5. **After Round 1:** Trigger scoring, leaderboard goes live
6. **Repeat weekly** throughout the season

The biggest time investment is the **initial data entry** (~4–5 hours one-time). After that it's ~20–30 min per matchday to enter results and trigger scoring.
