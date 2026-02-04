-- Add constraint to prevent a team playing itself
ALTER TABLE "Match" ADD CONSTRAINT "Match_different_teams_check" CHECK ("homeTeamId" != "awayTeamId");