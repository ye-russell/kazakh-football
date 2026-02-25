import { Module } from '@nestjs/common';
import { FantasyController } from './fantasy.controller';
import { FantasyService } from './fantasy.service';
import { ScoringService } from './scoring.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [FantasyController],
  providers: [FantasyService, ScoringService],
})
export class FantasyModule {}
