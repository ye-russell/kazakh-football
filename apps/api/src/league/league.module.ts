import { Module } from '@nestjs/common';
import { LeagueController } from './league.controller';
import { LeagueService } from './league.service';

@Module({
  controllers: [LeagueController],
  providers: [LeagueService],
})
export class LeagueModule {}
