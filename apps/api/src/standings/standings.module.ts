import { Module } from '@nestjs/common';
import { StandingsController } from './standings.controller';
import { StandingsService } from './standings.service';

@Module({
  controllers: [StandingsController],
  providers: [StandingsService],
})
export class StandingsModule {}
