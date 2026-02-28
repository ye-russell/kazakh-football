# Deployment Readiness & Data Population Guide

> Last updated: March 1, 2026

## Deployment Readiness

### Status overview

| Area | Status | Blocker? |
|------|--------|----------|
| API + DB (Supabase) | ✅ Ready | No |
| Frontend SPA | ✅ Ready | No |
| Auth (JWT) | ✅ Working | No |
| Fantasy system | ✅ Working | No |
| Real match/team/player data | ❌ Missing | **Yes** |
| Environment config (production) | ⚠️ Needs setup | Yes (incl. `ADMIN_API_KEY`) |
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
| Vice-captain (if captain didn't play) | 2× total points |

### After each round is complete

1. **Ensure all match data is entered** — scores, events (goals, assists, cards), lineups (who started, who was subbed in)
2. **Set all matches to `finished`** — this is important because squad changes are locked while any match has `status=live`
3. **Trigger scoring** — call the admin scoring endpoint:

```bash
curl -X POST http://localhost:3000/fantasy/score-round \
  -H "Content-Type: application/json" \
  -H "x-admin-key: YOUR_ADMIN_API_KEY" \
  -d '{"round": 1, "competition": "kpl"}'
```

   This will:
   - Look at every fantasy team's picks for that round
   - For each picked player, scan `MatchEvent` and `MatchLineup` to calculate points
   - Apply captain 2× multiplier (or vice-captain 2× if captain didn't play)
   - Create/update `FantasyGameweek` record (team + round + points)
   - Update `FantasyTeam.totalPoints` (sum of all gameweeks)
4. **Leaderboard updates automatically** — it queries by `totalPoints DESC`
5. **Users can view per-player breakdowns** — via the Gameweek History page on the frontend

### Practical workflow per matchday

```
Friday/Saturday/Sunday:
  → Matches played
  → Set match status to 'live' in Supabase (this locks squad changes)
  → Enter results (scores, events, lineups)
  → Set match status to 'finished'

Sunday/Monday evening:
  → Trigger fantasy scoring: POST /fantasy/score-round with x-admin-key header
  → Leaderboard refreshes
  → Users see updated points + per-player breakdowns
  → Squad changes are unlocked (no more live matches)
```

### What's not yet automated

- **No automatic trigger** — manually call `POST /fantasy/score-round` with the `x-admin-key` header after entering match data
- **No per-gameweek transfer limits** — users can edit squads freely between gameweeks (but changes are blocked during live matches)
- **Environment setup** — set `ADMIN_API_KEY` in your `.env` file for the scoring endpoint to work

---

## Recommended Launch Sequence

1. **Now:** Gather real team + player data, set fantasy prices
2. **1–2 weeks before season:** Seed teams, players, full fixture schedule. Deploy API + frontend
3. **Open registration:** Let users sign up and build fantasy squads
4. **Round 1 kickoff:** Lock squads (future feature), enter match results after games
5. **After Round 1:** Trigger scoring, leaderboard goes live
6. **Repeat weekly** throughout the season

The biggest time investment is the **initial data entry** (~4–5 hours one-time). After that it's ~20–30 min per matchday to enter results and trigger scoring.
