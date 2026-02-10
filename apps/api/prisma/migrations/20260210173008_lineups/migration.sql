-- AlterEnum
ALTER TYPE "MatchEventType" ADD VALUE 'substitution';

-- AlterTable
ALTER TABLE "MatchEvent" ADD COLUMN     "assistPlayerId" TEXT,
ADD COLUMN     "extraMinute" INTEGER,
ADD COLUMN     "subInPlayerId" TEXT,
ADD COLUMN     "subOutPlayerId" TEXT;

-- CreateTable
CREATE TABLE "MatchLineup" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "isStarter" BOOLEAN NOT NULL DEFAULT false,
    "position" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchLineup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MatchLineup_matchId_idx" ON "MatchLineup"("matchId");

-- CreateIndex
CREATE INDEX "MatchLineup_teamId_idx" ON "MatchLineup"("teamId");

-- CreateIndex
CREATE INDEX "MatchLineup_playerId_idx" ON "MatchLineup"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchLineup_matchId_playerId_key" ON "MatchLineup"("matchId", "playerId");

-- CreateIndex
CREATE INDEX "MatchEvent_assistPlayerId_idx" ON "MatchEvent"("assistPlayerId");

-- CreateIndex
CREATE INDEX "MatchEvent_subInPlayerId_idx" ON "MatchEvent"("subInPlayerId");

-- CreateIndex
CREATE INDEX "MatchEvent_subOutPlayerId_idx" ON "MatchEvent"("subOutPlayerId");

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_assistPlayerId_fkey" FOREIGN KEY ("assistPlayerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_subInPlayerId_fkey" FOREIGN KEY ("subInPlayerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_subOutPlayerId_fkey" FOREIGN KEY ("subOutPlayerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchLineup" ADD CONSTRAINT "MatchLineup_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchLineup" ADD CONSTRAINT "MatchLineup_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchLineup" ADD CONSTRAINT "MatchLineup_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
