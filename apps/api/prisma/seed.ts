import { PrismaClient, MatchStatus, MatchEventType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Upsert competitions
  const kpl = await prisma.competition.upsert({
    where: { code: 'kpl' },
    update: { name: 'KPL', season: 2026 },
    create: {
      code: 'kpl',
      name: 'KPL',
      season: 2026,
    },
  });

  const firstLeague = await prisma.competition.upsert({
    where: { code: 'first' },
    update: { name: 'First League', season: 2026 },
    create: {
      code: 'first',
      name: 'First League',
      season: 2026,
    },
  });

  console.log('✓ Competitions created');

  // Upsert teams (12-14 teams)
  const teams = await Promise.all([
    prisma.team.upsert({
      where: { name: 'FC Astana' },
      update: {},
      create: {
        name: 'FC Astana',
        shortName: 'AST',
        city: 'Astana',
      },
    }),
    prisma.team.upsert({
      where: { name: 'FC Kairat' },
      update: {},
      create: {
        name: 'FC Kairat',
        shortName: 'KAI',
        city: 'Almaty',
      },
    }),
    prisma.team.upsert({
      where: { name: 'FC Tobol' },
      update: {},
      create: {
        name: 'FC Tobol',
        shortName: 'TOB',
        city: 'Kostanay',
      },
    }),
    prisma.team.upsert({
      where: { name: 'FC Aktobe' },
      update: {},
      create: {
        name: 'FC Aktobe',
        shortName: 'AKT',
        city: 'Aktobe',
      },
    }),
    prisma.team.upsert({
      where: { name: 'FC Ordabasy' },
      update: {},
      create: {
        name: 'FC Ordabasy',
        shortName: 'ORD',
        city: 'Shymkent',
      },
    }),
    prisma.team.upsert({
      where: { name: 'FC Shakhter Karagandy' },
      update: {},
      create: {
        name: 'FC Shakhter Karagandy',
        shortName: 'SHA',
        city: 'Karagandy',
      },
    }),
    prisma.team.upsert({
      where: { name: 'FC Atyrau' },
      update: {},
      create: {
        name: 'FC Atyrau',
        shortName: 'ATY',
        city: 'Atyrau',
      },
    }),
    prisma.team.upsert({
      where: { name: 'FC Taraz' },
      update: {},
      create: {
        name: 'FC Taraz',
        shortName: 'TAR',
        city: 'Taraz',
      },
    }),
    prisma.team.upsert({
      where: { name: 'FC Aksu' },
      update: {},
      create: {
        name: 'FC Aksu',
        shortName: 'AKS',
        city: 'Pavlodar',
      },
    }),
    prisma.team.upsert({
      where: { name: 'FC Zhetysu' },
      update: {},
      create: {
        name: 'FC Zhetysu',
        shortName: 'ZHE',
        city: 'Taldykorgan',
      },
    }),
    prisma.team.upsert({
      where: { name: 'FC Kaisar' },
      update: {},
      create: {
        name: 'FC Kaisar',
        shortName: 'KAS',
        city: 'Kyzylorda',
      },
    }),
    prisma.team.upsert({
      where: { name: 'FC Caspiy' },
      update: {},
      create: {
        name: 'FC Caspiy',
        shortName: 'CAS',
        city: 'Aktau',
      },
    }),
  ]);

  console.log(`✓ ${teams.length} teams created`);

  // Cleanup players and events for seeded teams/matches to avoid duplicates
  await prisma.matchEvent.deleteMany({
    where: {
      match: {
        competitionId: kpl.id,
        round: 1,
      },
    },
  });

  await prisma.player.deleteMany({
    where: {
      teamId: {
        in: teams.map((team) => team.id),
      },
    },
  });

  // Delete existing matches for round 1 to avoid duplicates
  await prisma.match.deleteMany({
    where: {
      competitionId: kpl.id,
      round: 1,
    },
  });

  // Create KPL round 1 matches
  const baseDate = new Date('2026-03-15T15:00:00Z');

  const matches = await Promise.all([
    // Finished matches with scores
    prisma.match.create({
      data: {
        competitionId: kpl.id,
        round: 1,
        homeTeamId: teams[0].id, // FC Astana
        awayTeamId: teams[1].id, // FC Kairat
        kickoffAt: new Date(baseDate.getTime()),
        status: MatchStatus.finished,
        homeScore: 2,
        awayScore: 1,
      },
    }),
    prisma.match.create({
      data: {
        competitionId: kpl.id,
        round: 1,
        homeTeamId: teams[2].id, // FC Tobol
        awayTeamId: teams[3].id, // FC Aktobe
        kickoffAt: new Date(baseDate.getTime() + 3 * 60 * 60 * 1000), // +3 hours
        status: MatchStatus.finished,
        homeScore: 1,
        awayScore: 1,
      },
    }),
    prisma.match.create({
      data: {
        competitionId: kpl.id,
        round: 1,
        homeTeamId: teams[4].id, // FC Ordabasy
        awayTeamId: teams[5].id, // FC Shakhter
        kickoffAt: new Date(baseDate.getTime() + 6 * 60 * 60 * 1000), // +6 hours
        status: MatchStatus.finished,
        homeScore: 3,
        awayScore: 0,
      },
    }),
    // Live match with score
    prisma.match.create({
      data: {
        competitionId: kpl.id,
        round: 1,
        homeTeamId: teams[6].id, // FC Atyrau
        awayTeamId: teams[7].id, // FC Taraz
        kickoffAt: new Date(baseDate.getTime() + 24 * 60 * 60 * 1000), // +1 day
        status: MatchStatus.live,
        homeScore: 1,
        awayScore: 0,
      },
    }),
    // Scheduled matches with null scores
    prisma.match.create({
      data: {
        competitionId: kpl.id,
        round: 1,
        homeTeamId: teams[8].id, // FC Aksu
        awayTeamId: teams[9].id, // FC Zhetysu
        kickoffAt: new Date(baseDate.getTime() + 48 * 60 * 60 * 1000), // +2 days
        status: MatchStatus.scheduled,
        homeScore: null,
        awayScore: null,
      },
    }),
    prisma.match.create({
      data: {
        competitionId: kpl.id,
        round: 1,
        homeTeamId: teams[10].id, // FC Kaisar
        awayTeamId: teams[11].id, // FC Caspiy
        kickoffAt: new Date(baseDate.getTime() + 72 * 60 * 60 * 1000), // +3 days
        status: MatchStatus.scheduled,
        homeScore: null,
        awayScore: null,
      },
    }),
  ]);

  console.log(`✓ ${matches.length} matches created for KPL Round 1`);

  // Create players
  const playersByTeam = new Map<string, { id: string; name: string }[]>();
  const playerTemplates = [
    { name: 'Ayan', position: 'FW' },
    { name: 'Daniyar', position: 'MF' },
    { name: 'Ruslan', position: 'DF' },
    { name: 'Sultan', position: 'GK' },
  ];

  for (const team of teams) {
    const createdPlayers = await Promise.all(
      playerTemplates.map((template, index) =>
        prisma.player.create({
          data: {
            teamId: team.id,
            name: `${template.name} ${team.shortName}`,
            number: 7 + index,
            position: template.position,
          },
          select: {
            id: true,
            name: true,
          },
        })
      )
    );

    playersByTeam.set(team.id, createdPlayers);
  }

  console.log('✓ Players created');

  // Create match events for finished matches
  const [match1, match2, match3] = matches.slice(0, 3);

  const matchEvents = [
    // Match 1: Astana 2-1 Kairat
    {
      matchId: match1.id,
      teamId: match1.homeTeamId,
      playerId: playersByTeam.get(match1.homeTeamId)![0].id,
      type: MatchEventType.goal,
      minute: 12,
    },
    {
      matchId: match1.id,
      teamId: match1.awayTeamId,
      playerId: playersByTeam.get(match1.awayTeamId)![1].id,
      type: MatchEventType.goal,
      minute: 41,
    },
    {
      matchId: match1.id,
      teamId: match1.homeTeamId,
      playerId: playersByTeam.get(match1.homeTeamId)![2].id,
      type: MatchEventType.yellow_card,
      minute: 58,
    },
    {
      matchId: match1.id,
      teamId: match1.homeTeamId,
      playerId: playersByTeam.get(match1.homeTeamId)![0].id,
      type: MatchEventType.goal,
      minute: 76,
    },
    // Match 2: Tobol 1-1 Aktobe
    {
      matchId: match2.id,
      teamId: match2.homeTeamId,
      playerId: playersByTeam.get(match2.homeTeamId)![1].id,
      type: MatchEventType.goal,
      minute: 33,
    },
    {
      matchId: match2.id,
      teamId: match2.awayTeamId,
      playerId: playersByTeam.get(match2.awayTeamId)![0].id,
      type: MatchEventType.goal,
      minute: 69,
    },
    {
      matchId: match2.id,
      teamId: match2.awayTeamId,
      playerId: playersByTeam.get(match2.awayTeamId)![2].id,
      type: MatchEventType.yellow_card,
      minute: 80,
    },
    // Match 3: Ordabasy 3-0 Shakhter
    {
      matchId: match3.id,
      teamId: match3.homeTeamId,
      playerId: playersByTeam.get(match3.homeTeamId)![0].id,
      type: MatchEventType.goal,
      minute: 9,
    },
    {
      matchId: match3.id,
      teamId: match3.homeTeamId,
      playerId: playersByTeam.get(match3.homeTeamId)![1].id,
      type: MatchEventType.goal,
      minute: 52,
    },
    {
      matchId: match3.id,
      teamId: match3.homeTeamId,
      playerId: playersByTeam.get(match3.homeTeamId)![0].id,
      type: MatchEventType.goal,
      minute: 88,
    },
    {
      matchId: match3.id,
      teamId: match3.awayTeamId,
      playerId: playersByTeam.get(match3.awayTeamId)![3].id,
      type: MatchEventType.red_card,
      minute: 63,
    },
  ];

  await prisma.matchEvent.createMany({
    data: matchEvents,
  });

  console.log('✓ Match events created');
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
