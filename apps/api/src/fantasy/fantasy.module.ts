import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FantasyController } from './fantasy.controller';
import { FantasyService } from './fantasy.service';
import { ScoringService } from './scoring.service';
import { AdminKeyGuard } from './admin-key.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, ConfigModule],
  controllers: [FantasyController],
  providers: [FantasyService, ScoringService, AdminKeyGuard],
})
export class FantasyModule {}
