import { PrismaClient, MatchStatus } from '@prisma/client';

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
