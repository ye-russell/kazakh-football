-- CreateEnum
CREATE TYPE "FantasyPickPosition" AS ENUM ('GK', 'DF', 'MF', 'FW');

-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "price" DOUBLE PRECISION NOT NULL DEFAULT 5.0;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FantasyTeam" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "budget" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FantasyTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FantasyPick" (
    "id" TEXT NOT NULL,
    "fantasyTeamId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "isCaptain" BOOLEAN NOT NULL DEFAULT false,
    "isViceCaptain" BOOLEAN NOT NULL DEFAULT false,
    "position" "FantasyPickPosition" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FantasyPick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FantasyGameweek" (
    "id" TEXT NOT NULL,
    "fantasyTeamId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FantasyGameweek_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "FantasyTeam_userId_idx" ON "FantasyTeam"("userId");

-- CreateIndex
CREATE INDEX "FantasyTeam_competitionId_idx" ON "FantasyTeam"("competitionId");

-- CreateIndex
CREATE UNIQUE INDEX "FantasyTeam_userId_competitionId_key" ON "FantasyTeam"("userId", "competitionId");

-- CreateIndex
CREATE INDEX "FantasyPick_fantasyTeamId_idx" ON "FantasyPick"("fantasyTeamId");

-- CreateIndex
CREATE INDEX "FantasyPick_playerId_idx" ON "FantasyPick"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "FantasyPick_fantasyTeamId_playerId_key" ON "FantasyPick"("fantasyTeamId", "playerId");

-- CreateIndex
CREATE INDEX "FantasyGameweek_fantasyTeamId_idx" ON "FantasyGameweek"("fantasyTeamId");

-- CreateIndex
CREATE UNIQUE INDEX "FantasyGameweek_fantasyTeamId_round_key" ON "FantasyGameweek"("fantasyTeamId", "round");

-- AddForeignKey
ALTER TABLE "FantasyTeam" ADD CONSTRAINT "FantasyTeam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FantasyTeam" ADD CONSTRAINT "FantasyTeam_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FantasyPick" ADD CONSTRAINT "FantasyPick_fantasyTeamId_fkey" FOREIGN KEY ("fantasyTeamId") REFERENCES "FantasyTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FantasyPick" ADD CONSTRAINT "FantasyPick_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FantasyGameweek" ADD CONSTRAINT "FantasyGameweek_fantasyTeamId_fkey" FOREIGN KEY ("fantasyTeamId") REFERENCES "FantasyTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
