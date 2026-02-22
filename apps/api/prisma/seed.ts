import { PrismaClient, MatchStatus, MatchEventType } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
    },
  },
});

// ══════════════════════════════════════════════════════════════════
//  SQUAD DATA
//  18 players per team · indices 0-10 = starters · 11-17 = subs
//  Formation 4-3-3:
//    [0]  GK   [1-4] DF   [5-7] MF   [8-10] FW
//  Bench:
//    [11] GK   [12,17] DF   [13-14] MF   [15-16] FW
// ══════════════════════════════════════════════════════════════════

type PlayerDef = [name: string, num: number, pos: string];

const SQUADS: PlayerDef[][] = [
  /* ─── [0] FC Astana ─── */
  [
    ['Nikita Pavlov', 1, 'GK'],
    ['Nuraly Alipov', 2, 'DF'],
    ['Dmitry Logvinenko', 3, 'DF'],
    ['Marat Tagybergen', 4, 'DF'],
    ['Abzal Beysebekov', 5, 'DF'],
    ['Islambek Kuatov', 6, 'MF'],
    ['Askhat Tagybergen', 8, 'MF'],
    ['Abylaikhan Zhumagali', 10, 'MF'],
    ['Marat Bilyalov', 7, 'FW'],
    ['Zhambyl Kukeyev', 9, 'FW'],
    ['Roman Murtazayev', 11, 'FW'],
    ['Duman Narzildin', 30, 'GK'],
    ['Temirlan Erlanov', 14, 'DF'],
    ['Georgi Malyshev', 16, 'MF'],
    ['Sagadat Tursynov', 20, 'MF'],
    ['Talgat Kaliyev', 19, 'FW'],
    ['Oralkhan Omirtay', 21, 'FW'],
    ['Maxat Saparov', 15, 'DF'],
  ],

  /* ─── [1] FC Kairat ─── */
  [
    ['Vladimir Plotnikov', 1, 'GK'],
    ['Gafurzhan Suyumbayev', 2, 'DF'],
    ['Nurbol Zhumaskaliyev', 3, 'DF'],
    ['Sergei Maliy', 4, 'DF'],
    ['Aleksandr Marochkin', 5, 'DF'],
    ['Bauyrzhan Islamkhan', 8, 'MF'],
    ['Erkebulan Seidakhmetov', 10, 'MF'],
    ['Daniyar Yeleussinov', 6, 'MF'],
    ['Artur Shushenachev', 7, 'FW'],
    ['Vagner de Souza', 9, 'FW'],
    ['Kairat Zhyrgalbek', 11, 'FW'],
    ['Dias Duisembayev', 30, 'GK'],
    ['Nurseit Nabi', 14, 'DF'],
    ['Aleksei Shchetkin', 16, 'MF'],
    ['Yerkebulan Tungyshbay', 20, 'MF'],
    ['Kanagat Tashenbay', 19, 'FW'],
    ['Abylaihan Tabyldy', 21, 'FW'],
    ['Serikzhan Muzhikov', 15, 'DF'],
  ],

  /* ─── [2] FC Tobol ─── */
  [
    ['Luka Milanovic', 1, 'GK'],
    ['Kazbek Geteriyev', 2, 'DF'],
    ['Askhat Almakhanov', 3, 'DF'],
    ['Roman Nesterenko', 4, 'DF'],
    ['Davit Marshalkin', 5, 'DF'],
    ['Zhaksylyk Talgat', 6, 'MF'],
    ['Daniyar Ashimov', 8, 'MF'],
    ['Nurzhan Kenesov', 10, 'MF'],
    ['Ruslan Valiullin', 7, 'FW'],
    ['Sherzod Azamov', 9, 'FW'],
    ['Alisher Abdrahmanov', 11, 'FW'],
    ['Yegor Sokolov', 30, 'GK'],
    ['Daulet Satbayev', 14, 'DF'],
    ['Adil Kairov', 16, 'MF'],
    ['Nurlan Aitenov', 20, 'MF'],
    ['Serik Dzhunkeyev', 19, 'FW'],
    ['Meirzhan Omarov', 21, 'FW'],
    ['Baurzhan Turysbek', 15, 'DF'],
  ],

  /* ─── [3] FC Aktobe ─── */
  [
    ['Aleksandr Mokin', 1, 'GK'],
    ['Ruslan Kiselyov', 2, 'DF'],
    ['Erkin Tapayev', 3, 'DF'],
    ['Stanislav Lunin', 4, 'DF'],
    ['Marko Simovic', 5, 'DF'],
    ['Nurdaulet Nabiullin', 6, 'MF'],
    ['Temirlan Doszhanov', 8, 'MF'],
    ['Adilet Kuat', 10, 'MF'],
    ['Maksim Fedin', 7, 'FW'],
    ['Zhambyl Aimbetov', 9, 'FW'],
    ['Abylay Mustafin', 11, 'FW'],
    ['Samat Otarbayev', 30, 'GK'],
    ['Dauren Ospanov', 14, 'DF'],
    ['Yermek Kuantayev', 16, 'MF'],
    ['Serik Adamtayev', 20, 'MF'],
    ['Kuat Sultanov', 19, 'FW'],
    ['Bolat Nazarov', 21, 'FW'],
    ['Anuar Turganbayev', 15, 'DF'],
  ],

  /* ─── [4] FC Ordabasy ─── */
  [
    ['Andrei Sidelnikov', 1, 'GK'],
    ['Nurlan Mukanbet', 2, 'DF'],
    ['Denis Popov', 3, 'DF'],
    ['Askhat Dosmagambetov', 4, 'DF'],
    ['Kanat Biyashev', 5, 'DF'],
    ['Yerlan Akhmetov', 6, 'MF'],
    ['Serik Kozhamberdiyev', 8, 'MF'],
    ['Rasul Zhangaziyev', 10, 'MF'],
    ['Baurzhan Orazov', 7, 'FW'],
    ['Dias Nurgaliyev', 9, 'FW'],
    ['Yerzhan Azmukhan', 11, 'FW'],
    ['Berik Sauranbekov', 30, 'GK'],
    ['Talgat Orazbekov', 14, 'DF'],
    ['Murad Musayev', 16, 'MF'],
    ['Nurken Mazbaev', 20, 'MF'],
    ['Adilkhan Mukazhanov', 19, 'FW'],
    ['Roman Grigorchuk', 21, 'FW'],
    ['Abylai Tleshev', 15, 'DF'],
  ],

  /* ─── [5] FC Shakhter Karagandy ─── */
  [
    ['Dmytro Nepogodov', 1, 'GK'],
    ['Ivan Maevski', 2, 'DF'],
    ['Zhangir Amangeldin', 3, 'DF'],
    ['Bolat Emilbekov', 4, 'DF'],
    ['Yevgeni Postnikov', 5, 'DF'],
    ['Damir Shomko', 6, 'MF'],
    ['Alibek Buleshev', 8, 'MF'],
    ['Kairat Nurdauletov', 10, 'MF'],
    ['Adilbek Jaxybekov', 7, 'FW'],
    ['Sergei Khiznichenko', 9, 'FW'],
    ['Marat Shagyrbekov', 11, 'FW'],
    ['Artem Gorokhov', 30, 'GK'],
    ['Bagdat Kairov', 14, 'DF'],
    ['Ruslan Abdulov', 16, 'MF'],
    ['Duman Kudaibergen', 20, 'MF'],
    ['Yegor Nakamura', 19, 'FW'],
    ['Azat Nurgaliyev', 21, 'FW'],
    ['Kuanysh Akhanov', 15, 'DF'],
  ],

  /* ─── [6] FC Atyrau ─── */
  [
    ['Ilya Vorotnikov', 1, 'GK'],
    ['Nurlan Yermakhanov', 2, 'DF'],
    ['Maxim Grigoryev', 3, 'DF'],
    ['Serik Yedilbayev', 4, 'DF'],
    ['Aslan Kamkin', 5, 'DF'],
    ['Madi Zhakipbayev', 6, 'MF'],
    ['Olzhas Baymuratov', 8, 'MF'],
    ['Daniyar Mukhanov', 10, 'MF'],
    ['Kayrat Nurzhanov', 7, 'FW'],
    ['Arman Kenzhebayev', 9, 'FW'],
    ['Ivan Zotko', 11, 'FW'],
    ['Bakytzhan Sartov', 30, 'GK'],
    ['Aidar Kozhabayev', 14, 'DF'],
    ['Timur Dosmagambetov', 16, 'MF'],
    ['Ravil Gainullin', 20, 'MF'],
    ['Sultan Kairbayev', 19, 'FW'],
    ['Yerzhan Amantayev', 21, 'FW'],
    ['Dauren Tolegenov', 15, 'DF'],
  ],

  /* ─── [7] FC Taraz ─── */
  [
    ['Andrei Shabanov', 1, 'GK'],
    ['Rustem Urazov', 2, 'DF'],
    ['Bakhtiyor Ashurmatov', 3, 'DF'],
    ['Daniyar Karimov', 4, 'DF'],
    ['Kairzhan Turysbek', 5, 'DF'],
    ['Erik Zhumagulov', 6, 'MF'],
    ['Mamadou Diagouraga', 8, 'MF'],
    ['Askhat Boranbayev', 10, 'MF'],
    ['Dias Omarov', 7, 'FW'],
    ['Aleksandr Tarasov', 9, 'FW'],
    ['Serikzhan Bakhtiyarov', 11, 'FW'],
    ['Nurzhan Adakhajiyev', 30, 'GK'],
    ['Berik Kuatov', 14, 'DF'],
    ['Dastan Toimbayev', 16, 'MF'],
    ['Yerlan Ospanov', 20, 'MF'],
    ['Kanat Azhgaliyev', 19, 'FW'],
    ['Dossym Esmukhanov', 21, 'FW'],
    ['Olzhas Syzdykov', 15, 'DF'],
  ],

  /* ─── [8] FC Aksu ─── */
  [
    ['Pyotr Shevchenko', 1, 'GK'],
    ['Armanzhan Asetov', 2, 'DF'],
    ['Bekzat Mukhamedzhanov', 3, 'DF'],
    ['Damir Zhakypov', 4, 'DF'],
    ['Serik Tulegenov', 5, 'DF'],
    ['Aybol Abiken', 6, 'MF'],
    ['Ruslan Mingazov', 8, 'MF'],
    ['Kuanysh Astanov', 10, 'MF'],
    ['Miras Seidaly', 7, 'FW'],
    ['Talgat Mukatayev', 9, 'FW'],
    ['Bakhytzhan Moldagaliyev', 11, 'FW'],
    ['Ilyas Yerkasov', 30, 'GK'],
    ['Askar Bazhanov', 14, 'DF'],
    ['Serikbol Khizullin', 16, 'MF'],
    ['Yerzhan Tokpanov', 20, 'MF'],
    ['Adil Ospanov', 19, 'FW'],
    ['Nurbol Zhanturinov', 21, 'FW'],
    ['Daniyar Seyilkhanov', 15, 'DF'],
  ],

  /* ─── [9] FC Zhetysu ─── */
  [
    ['Roman Grigorenko', 1, 'GK'],
    ['Baurzhan Dzholchiyev', 2, 'DF'],
    ['Sherzod Karimov', 3, 'DF'],
    ['Andrei Arkhipov', 4, 'DF'],
    ['Sabit Imanghali', 5, 'DF'],
    ['Zhandos Orazbekov', 6, 'MF'],
    ['Almas Yerkin', 8, 'MF'],
    ['Erlan Kairkenov', 10, 'MF'],
    ['Bolat Duisenbayev', 7, 'FW'],
    ['Nurlybek Nurgaziyev', 9, 'FW'],
    ['Sergei Bozhko', 11, 'FW'],
    ['Ashat Sabitov', 30, 'GK'],
    ['Dauren Baitasov', 14, 'DF'],
    ['Ansat Ayazbayev', 16, 'MF'],
    ['Erbol Yertayev', 20, 'MF'],
    ['Dias Kameshev', 19, 'FW'],
    ['Yermek Kurmanbayev', 21, 'FW'],
    ['Bauyrzhan Musin', 15, 'DF'],
  ],

  /* ─── [10] FC Kaisar ─── */
  [
    ['Gevorg Najaryan', 1, 'GK'],
    ['Almat Bekbauov', 2, 'DF'],
    ['Timur Dosmukhambetov', 3, 'DF'],
    ['Nurlan Kenzhebalin', 4, 'DF'],
    ['Aziz Ibragimov', 5, 'DF'],
    ['Meirbek Mussabayev', 6, 'MF'],
    ['Ulan Konysbayev', 8, 'MF'],
    ['Aibar Zhaksylykov', 10, 'MF'],
    ['Dias Salpingidi', 7, 'FW'],
    ['Daulet Kenbayev', 9, 'FW'],
    ['Kairat Ashirbekov', 11, 'FW'],
    ['Talgat Zhylyshbayev', 30, 'GK'],
    ['Ernar Salimov', 14, 'DF'],
    ['Kanat Sydykov', 16, 'MF'],
    ['Daniyar Tursunov', 20, 'MF'],
    ['Azat Yerseitov', 19, 'FW'],
    ['Serikzhan Aitbayev', 21, 'FW'],
    ['Mukhtar Daurenov', 15, 'DF'],
  ],

  /* ─── [11] FC Caspiy ─── */
  [
    ['Vladislav Fomin', 1, 'GK'],
    ['Aibol Bukenbayev', 2, 'DF'],
    ['Ivan Yarotsky', 3, 'DF'],
    ['Adilet Zheksembin', 4, 'DF'],
    ['Yuri Logvinov', 5, 'DF'],
    ['Darkhan Boranbaev', 6, 'MF'],
    ['Arsen Khubulov', 8, 'MF'],
    ['Nursultan Asetov', 10, 'MF'],
    ['Kairat Kopbosyn', 7, 'FW'],
    ['Abdulla Al-Harbi', 9, 'FW'],
    ['Zhenis Tursunov', 11, 'FW'],
    ['Marat Khairullin', 30, 'GK'],
    ['Sanzhar Turganbayev', 14, 'DF'],
    ['Altynbek Moldashev', 16, 'MF'],
    ['Bekbolat Utegenov', 20, 'MF'],
    ['Daulet Ydyrys', 19, 'FW'],
    ['Serikzhan Muratov', 21, 'FW'],
    ['Ryskeldi Amirov', 15, 'DF'],
  ],
];

// ══════════════════════════════════════════════════════════════════
//  MAIN
// ══════════════════════════════════════════════════════════════════

async function main() {
  console.log('Starting seed...');

  // ── 1. Competitions ──────────────────────────────────────────

  const kpl = await prisma.competition.upsert({
    where: { code: 'kpl' },
    update: { name: 'KPL', season: 2026 },
    create: { code: 'kpl', name: 'KPL', season: 2026 },
  });

  await prisma.competition.upsert({
    where: { code: 'first' },
    update: { name: 'First League', season: 2026 },
    create: { code: 'first', name: 'First League', season: 2026 },
  });

  console.log('✓ Competitions');

  // ── 2. Teams ─────────────────────────────────────────────────

  const teamDefs: [name: string, short: string, city: string][] = [
    ['FC Astana', 'AST', 'Astana'],
    ['FC Kairat', 'KAI', 'Almaty'],
    ['FC Tobol', 'TOB', 'Kostanay'],
    ['FC Aktobe', 'AKT', 'Aktobe'],
    ['FC Ordabasy', 'ORD', 'Shymkent'],
    ['FC Shakhter Karagandy', 'SHA', 'Karagandy'],
    ['FC Atyrau', 'ATY', 'Atyrau'],
    ['FC Taraz', 'TAR', 'Taraz'],
    ['FC Aksu', 'AKS', 'Pavlodar'],
    ['FC Zhetysu', 'ZHE', 'Taldykorgan'],
    ['FC Kaisar', 'KAS', 'Kyzylorda'],
    ['FC Caspiy', 'CAS', 'Aktau'],
  ];

  const teams = await Promise.all(
    teamDefs.map(([name, shortName, city]) =>
      prisma.team.upsert({
        where: { name },
        update: {},
        create: { name, shortName, city },
      }),
    ),
  );

  console.log(`✓ ${teams.length} teams`);

  // ── 3. Cleanup ───────────────────────────────────────────────

  await prisma.matchEvent.deleteMany({
    where: { match: { competitionId: kpl.id, round: { in: [1, 2] } } },
  });
  await prisma.matchLineup.deleteMany({
    where: { match: { competitionId: kpl.id, round: { in: [1, 2] } } },
  });
  await prisma.player.deleteMany({
    where: { teamId: { in: teams.map((t) => t.id) } },
  });
  await prisma.match.deleteMany({
    where: { competitionId: kpl.id, round: { in: [1, 2] } },
  });

  console.log('✓ Old data cleaned');

  // ── 4. Players ───────────────────────────────────────────────

  const players: { id: string; name: string }[][] = [];

  for (let t = 0; t < teams.length; t++) {
    const squad = await Promise.all(
      SQUADS[t].map(([name, number, position]) =>
        prisma.player.create({
          data: { teamId: teams[t].id, name, number, position },
          select: { id: true, name: true },
        }),
      ),
    );
    players.push(squad);
  }

  console.log(`✓ ${players.flat().length} players created`);

  // Shortcuts
  const pid = (teamIdx: number, playerIdx: number) =>
    players[teamIdx][playerIdx].id;
  const tid = (teamIdx: number) => teams[teamIdx].id;

  // ── 5. Round 1 matches (ALL FINISHED) ────────────────────────

  const r1Base = new Date('2026-03-15T15:00:00Z');
  const h = 3_600_000; // 1 hour in ms

  const r1 = await Promise.all([
    // M0: Astana 2-1 Kairat
    prisma.match.create({
      data: {
        competitionId: kpl.id,
        round: 1,
        homeTeamId: tid(0),
        awayTeamId: tid(1),
        kickoffAt: new Date(r1Base.getTime()),
        status: MatchStatus.finished,
        homeScore: 2,
        awayScore: 1,
      },
    }),
    // M1: Tobol 1-1 Aktobe
    prisma.match.create({
      data: {
        competitionId: kpl.id,
        round: 1,
        homeTeamId: tid(2),
        awayTeamId: tid(3),
        kickoffAt: new Date(r1Base.getTime() + 3 * h),
        status: MatchStatus.finished,
        homeScore: 1,
        awayScore: 1,
      },
    }),
    // M2: Ordabasy 3-0 Shakhter
    prisma.match.create({
      data: {
        competitionId: kpl.id,
        round: 1,
        homeTeamId: tid(4),
        awayTeamId: tid(5),
        kickoffAt: new Date(r1Base.getTime() + 6 * h),
        status: MatchStatus.finished,
        homeScore: 3,
        awayScore: 0,
      },
    }),
    // M3: Atyrau 1-0 Taraz
    prisma.match.create({
      data: {
        competitionId: kpl.id,
        round: 1,
        homeTeamId: tid(6),
        awayTeamId: tid(7),
        kickoffAt: new Date(r1Base.getTime() + 24 * h),
        status: MatchStatus.finished,
        homeScore: 1,
        awayScore: 0,
      },
    }),
    // M4: Aksu 2-1 Zhetysu
    prisma.match.create({
      data: {
        competitionId: kpl.id,
        round: 1,
        homeTeamId: tid(8),
        awayTeamId: tid(9),
        kickoffAt: new Date(r1Base.getTime() + 48 * h),
        status: MatchStatus.finished,
        homeScore: 2,
        awayScore: 1,
      },
    }),
    // M5: Kaisar 0-1 Caspiy
    prisma.match.create({
      data: {
        competitionId: kpl.id,
        round: 1,
        homeTeamId: tid(10),
        awayTeamId: tid(11),
        kickoffAt: new Date(r1Base.getTime() + 72 * h),
        status: MatchStatus.finished,
        homeScore: 0,
        awayScore: 1,
      },
    }),
  ]);

  console.log(`✓ ${r1.length} Round 1 matches (all finished)`);

  // ── 6. Round 2 matches (mixed) ──────────────────────────────

  const r2Base = new Date('2026-03-22T15:00:00Z');

  const r2 = await Promise.all([
    // M0: Kairat 2-1 Astana (finished)
    prisma.match.create({
      data: {
        competitionId: kpl.id,
        round: 2,
        homeTeamId: tid(1),
        awayTeamId: tid(0),
        kickoffAt: new Date(r2Base.getTime()),
        status: MatchStatus.finished,
        homeScore: 2,
        awayScore: 1,
      },
    }),
    // M1: Aktobe 2-0 Tobol (finished)
    prisma.match.create({
      data: {
        competitionId: kpl.id,
        round: 2,
        homeTeamId: tid(3),
        awayTeamId: tid(2),
        kickoffAt: new Date(r2Base.getTime() + 3 * h),
        status: MatchStatus.finished,
        homeScore: 2,
        awayScore: 0,
      },
    }),
    // M2: Shakhter 0-1 Ordabasy (finished)
    prisma.match.create({
      data: {
        competitionId: kpl.id,
        round: 2,
        homeTeamId: tid(5),
        awayTeamId: tid(4),
        kickoffAt: new Date(r2Base.getTime() + 6 * h),
        status: MatchStatus.finished,
        homeScore: 0,
        awayScore: 1,
      },
    }),
    // M3: Taraz 1-0 Atyrau (live)
    prisma.match.create({
      data: {
        competitionId: kpl.id,
        round: 2,
        homeTeamId: tid(7),
        awayTeamId: tid(6),
        kickoffAt: new Date(r2Base.getTime() + 24 * h),
        status: MatchStatus.live,
        homeScore: 1,
        awayScore: 0,
      },
    }),
    // M4: Zhetysu vs Aksu (scheduled)
    prisma.match.create({
      data: {
        competitionId: kpl.id,
        round: 2,
        homeTeamId: tid(9),
        awayTeamId: tid(8),
        kickoffAt: new Date(r2Base.getTime() + 48 * h),
        status: MatchStatus.scheduled,
        homeScore: null,
        awayScore: null,
      },
    }),
    // M5: Caspiy vs Kaisar (scheduled)
    prisma.match.create({
      data: {
        competitionId: kpl.id,
        round: 2,
        homeTeamId: tid(11),
        awayTeamId: tid(10),
        kickoffAt: new Date(r2Base.getTime() + 72 * h),
        status: MatchStatus.scheduled,
        homeScore: null,
        awayScore: null,
      },
    }),
  ]);

  console.log(`✓ ${r2.length} Round 2 matches`);

  // ── 7. Lineups ───────────────────────────────────────────────
  // All started matches (finished + live) get full 18-man squads

  const startedMatchPairs: [
    matchId: string,
    homeIdx: number,
    awayIdx: number,
  ][] = [
    // Round 1 — all 6 finished
    [r1[0].id, 0, 1],
    [r1[1].id, 2, 3],
    [r1[2].id, 4, 5],
    [r1[3].id, 6, 7],
    [r1[4].id, 8, 9],
    [r1[5].id, 10, 11],
    // Round 2 — 3 finished + 1 live
    [r2[0].id, 1, 0],
    [r2[1].id, 3, 2],
    [r2[2].id, 5, 4],
    [r2[3].id, 7, 6],
  ];

  const lineupData = startedMatchPairs.flatMap(([matchId, hIdx, aIdx]) =>
    [hIdx, aIdx].flatMap((tIdx) =>
      players[tIdx].map((player, i) => ({
        matchId,
        teamId: tid(tIdx),
        playerId: player.id,
        isStarter: i < 11,
        position: SQUADS[tIdx][i][2],
      })),
    ),
  );

  await prisma.matchLineup.createMany({ data: lineupData });
  console.log(`✓ ${lineupData.length} lineup entries`);

  // ── 8. Match Events ──────────────────────────────────────────

  const { goal, yellow_card, red_card, substitution } = MatchEventType;

  const events = [
    // ────────────────────────────────────────────────────────────
    // R1 M0: Astana 2-1 Kairat
    // ────────────────────────────────────────────────────────────
    {
      matchId: r1[0].id,
      teamId: tid(0),
      playerId: pid(0, 8),
      assistPlayerId: pid(0, 7),
      type: goal,
      minute: 12,
    },
    {
      matchId: r1[0].id,
      teamId: tid(0),
      playerId: pid(0, 4),
      type: yellow_card,
      minute: 34,
    },
    {
      matchId: r1[0].id,
      teamId: tid(1),
      playerId: pid(1, 9),
      assistPlayerId: pid(1, 5),
      type: goal,
      minute: 41,
    },
    {
      matchId: r1[0].id,
      teamId: tid(0),
      playerId: pid(0, 10),
      subInPlayerId: pid(0, 15),
      subOutPlayerId: pid(0, 10),
      type: substitution,
      minute: 55,
    },
    {
      matchId: r1[0].id,
      teamId: tid(1),
      playerId: pid(1, 6),
      type: yellow_card,
      minute: 70,
    },
    {
      matchId: r1[0].id,
      teamId: tid(0),
      playerId: pid(0, 8),
      assistPlayerId: pid(0, 6),
      type: goal,
      minute: 76,
    },

    // ────────────────────────────────────────────────────────────
    // R1 M1: Tobol 1-1 Aktobe
    // ────────────────────────────────────────────────────────────
    {
      matchId: r1[1].id,
      teamId: tid(2),
      playerId: pid(2, 6),
      assistPlayerId: pid(2, 8),
      type: goal,
      minute: 33,
    },
    {
      matchId: r1[1].id,
      teamId: tid(3),
      playerId: pid(3, 3),
      type: yellow_card,
      minute: 58,
    },
    {
      matchId: r1[1].id,
      teamId: tid(3),
      playerId: pid(3, 9),
      type: goal,
      minute: 69,
    },
    {
      matchId: r1[1].id,
      teamId: tid(3),
      playerId: pid(3, 10),
      subInPlayerId: pid(3, 15),
      subOutPlayerId: pid(3, 10),
      type: substitution,
      minute: 74,
    },
    {
      matchId: r1[1].id,
      teamId: tid(2),
      playerId: pid(2, 2),
      type: yellow_card,
      minute: 80,
    },

    // ────────────────────────────────────────────────────────────
    // R1 M2: Ordabasy 3-0 Shakhter
    // ────────────────────────────────────────────────────────────
    {
      matchId: r1[2].id,
      teamId: tid(4),
      playerId: pid(4, 8),
      assistPlayerId: pid(4, 5),
      type: goal,
      minute: 9,
    },
    {
      matchId: r1[2].id,
      teamId: tid(5),
      playerId: pid(5, 6),
      type: yellow_card,
      minute: 45,
    },
    {
      matchId: r1[2].id,
      teamId: tid(4),
      playerId: pid(4, 6),
      type: goal,
      minute: 52,
    },
    {
      matchId: r1[2].id,
      teamId: tid(5),
      playerId: pid(5, 3),
      type: red_card,
      minute: 63,
    },
    {
      matchId: r1[2].id,
      teamId: tid(4),
      playerId: pid(4, 9),
      subInPlayerId: pid(4, 16),
      subOutPlayerId: pid(4, 9),
      type: substitution,
      minute: 72,
    },
    {
      matchId: r1[2].id,
      teamId: tid(4),
      playerId: pid(4, 8),
      assistPlayerId: pid(4, 7),
      type: goal,
      minute: 88,
    },

    // ────────────────────────────────────────────────────────────
    // R1 M3: Atyrau 1-0 Taraz
    // ────────────────────────────────────────────────────────────
    {
      matchId: r1[3].id,
      teamId: tid(7),
      playerId: pid(7, 1),
      type: yellow_card,
      minute: 27,
    },
    {
      matchId: r1[3].id,
      teamId: tid(6),
      playerId: pid(6, 5),
      type: yellow_card,
      minute: 45,
      extraMinute: 2,
    },
    {
      matchId: r1[3].id,
      teamId: tid(6),
      playerId: pid(6, 9),
      assistPlayerId: pid(6, 7),
      type: goal,
      minute: 62,
    },
    {
      matchId: r1[3].id,
      teamId: tid(7),
      playerId: pid(7, 10),
      subInPlayerId: pid(7, 15),
      subOutPlayerId: pid(7, 10),
      type: substitution,
      minute: 78,
    },
    {
      matchId: r1[3].id,
      teamId: tid(6),
      playerId: pid(6, 8),
      subInPlayerId: pid(6, 16),
      subOutPlayerId: pid(6, 8),
      type: substitution,
      minute: 85,
    },

    // ────────────────────────────────────────────────────────────
    // R1 M4: Aksu 2-1 Zhetysu
    // ────────────────────────────────────────────────────────────
    {
      matchId: r1[4].id,
      teamId: tid(9),
      playerId: pid(9, 8),
      type: goal,
      minute: 15,
    },
    {
      matchId: r1[4].id,
      teamId: tid(8),
      playerId: pid(8, 2),
      type: yellow_card,
      minute: 38,
    },
    {
      matchId: r1[4].id,
      teamId: tid(8),
      playerId: pid(8, 9),
      assistPlayerId: pid(8, 6),
      type: goal,
      minute: 50,
    },
    {
      matchId: r1[4].id,
      teamId: tid(9),
      playerId: pid(9, 7),
      subInPlayerId: pid(9, 13),
      subOutPlayerId: pid(9, 7),
      type: substitution,
      minute: 67,
    },
    {
      matchId: r1[4].id,
      teamId: tid(8),
      playerId: pid(8, 8),
      assistPlayerId: pid(8, 5),
      type: goal,
      minute: 82,
    },
    {
      matchId: r1[4].id,
      teamId: tid(9),
      playerId: pid(9, 4),
      type: yellow_card,
      minute: 90,
    },

    // ────────────────────────────────────────────────────────────
    // R1 M5: Kaisar 0-1 Caspiy
    // ────────────────────────────────────────────────────────────
    {
      matchId: r1[5].id,
      teamId: tid(10),
      playerId: pid(10, 5),
      type: yellow_card,
      minute: 20,
    },
    {
      matchId: r1[5].id,
      teamId: tid(11),
      playerId: pid(11, 3),
      type: yellow_card,
      minute: 43,
    },
    {
      matchId: r1[5].id,
      teamId: tid(10),
      playerId: pid(10, 10),
      subInPlayerId: pid(10, 15),
      subOutPlayerId: pid(10, 10),
      type: substitution,
      minute: 55,
    },
    {
      matchId: r1[5].id,
      teamId: tid(11),
      playerId: pid(11, 8),
      assistPlayerId: pid(11, 6),
      type: goal,
      minute: 71,
    },
    {
      matchId: r1[5].id,
      teamId: tid(10),
      playerId: pid(10, 1),
      type: yellow_card,
      minute: 84,
    },
    {
      matchId: r1[5].id,
      teamId: tid(11),
      playerId: pid(11, 5),
      subInPlayerId: pid(11, 14),
      subOutPlayerId: pid(11, 5),
      type: substitution,
      minute: 87,
    },

    // ────────────────────────────────────────────────────────────
    // R2 M0: Kairat 2-1 Astana
    // ────────────────────────────────────────────────────────────
    {
      matchId: r2[0].id,
      teamId: tid(1),
      playerId: pid(1, 8),
      assistPlayerId: pid(1, 5),
      type: goal,
      minute: 18,
    },
    {
      matchId: r2[0].id,
      teamId: tid(0),
      playerId: pid(0, 6),
      type: goal,
      minute: 35,
    },
    {
      matchId: r2[0].id,
      teamId: tid(1),
      playerId: pid(1, 2),
      type: yellow_card,
      minute: 44,
    },
    {
      matchId: r2[0].id,
      teamId: tid(0),
      playerId: pid(0, 10),
      subInPlayerId: pid(0, 15),
      subOutPlayerId: pid(0, 10),
      type: substitution,
      minute: 66,
    },
    {
      matchId: r2[0].id,
      teamId: tid(1),
      playerId: pid(1, 6),
      assistPlayerId: pid(1, 8),
      type: goal,
      minute: 71,
    },

    // ────────────────────────────────────────────────────────────
    // R2 M1: Aktobe 2-0 Tobol
    // ────────────────────────────────────────────────────────────
    {
      matchId: r2[1].id,
      teamId: tid(3),
      playerId: pid(3, 8),
      assistPlayerId: pid(3, 2),
      type: goal,
      minute: 14,
    },
    {
      matchId: r2[1].id,
      teamId: tid(2),
      playerId: pid(2, 5),
      type: yellow_card,
      minute: 39,
    },
    {
      matchId: r2[1].id,
      teamId: tid(3),
      playerId: pid(3, 6),
      type: goal,
      minute: 67,
    },
    {
      matchId: r2[1].id,
      teamId: tid(3),
      playerId: pid(3, 9),
      subInPlayerId: pid(3, 16),
      subOutPlayerId: pid(3, 9),
      type: substitution,
      minute: 82,
    },

    // ────────────────────────────────────────────────────────────
    // R2 M2: Shakhter 0-1 Ordabasy
    // ────────────────────────────────────────────────────────────
    {
      matchId: r2[2].id,
      teamId: tid(5),
      playerId: pid(5, 5),
      type: yellow_card,
      minute: 28,
    },
    {
      matchId: r2[2].id,
      teamId: tid(4),
      playerId: pid(4, 8),
      assistPlayerId: pid(4, 5),
      type: goal,
      minute: 51,
    },
    {
      matchId: r2[2].id,
      teamId: tid(5),
      playerId: pid(5, 2),
      type: red_card,
      minute: 77,
    },

    // ────────────────────────────────────────────────────────────
    // R2 M3: Taraz 1-0 Atyrau (live)
    // ────────────────────────────────────────────────────────────
    {
      matchId: r2[3].id,
      teamId: tid(7),
      playerId: pid(7, 9),
      type: goal,
      minute: 31,
    },
  ];

  await prisma.matchEvent.createMany({ data: events });
  console.log(`✓ ${events.length} match events`);

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
