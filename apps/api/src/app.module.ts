import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { LeagueModule } from './league/league.module';
import { TeamsModule } from './teams/teams.module';
import { MatchesModule } from './matches/matches.module';
import { StandingsModule } from './standings/standings.module';
import { HealthModule } from './health/health.module';
import { PlayersModule } from './players/players.module';
import { StatsModule } from './stats/stats.module';
import { AuthModule } from './auth/auth.module';
import { FantasyModule } from './fantasy/fantasy.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    LeagueModule,
    TeamsModule,
    MatchesModule,
    StandingsModule,
    PlayersModule,
    StatsModule,
    HealthModule,
    AuthModule,
    FantasyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
