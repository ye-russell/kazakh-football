import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiHeader,
} from '@nestjs/swagger';
import { FantasyService } from './fantasy.service';
import { ScoringService } from './scoring.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminKeyGuard } from './admin-key.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateFantasyTeamDto } from './dto/create-fantasy-team.dto';
import { UpdatePicksDto } from './dto/update-picks.dto';
import { ScoreRoundDto } from './dto/score-round.dto';

@ApiTags('fantasy')
@Controller('fantasy')
export class FantasyController {
  constructor(
    private readonly fantasyService: FantasyService,
    private readonly scoringService: ScoringService,
  ) {}

  // ── Public endpoints ──────────────────────────────────────────

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get fantasy leaderboard' })
  @ApiQuery({ name: 'competition', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Returns fantasy leaderboard' })
  getLeaderboard(@Query('competition') competition?: string) {
    return this.fantasyService.getLeaderboard(competition);
  }

  @Get('players')
  @ApiOperation({ summary: 'Get available players with prices' })
  @ApiQuery({ name: 'competition', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Returns players with fantasy prices' })
  getAvailablePlayers(@Query('competition') competition?: string) {
    return this.fantasyService.getAvailablePlayers(competition);
  }

  @Get('teams/:id')
  @ApiOperation({ summary: 'Get a fantasy team by ID' })
  @ApiResponse({ status: 200, description: 'Returns the fantasy team' })
  @ApiResponse({ status: 404, description: 'Team not found' })
  getTeamById(@Param('id', ParseUUIDPipe) id: string) {
    return this.fantasyService.getTeamById(id);
  }

  @Get('teams/:id/gameweeks')
  @ApiOperation({ summary: 'Get gameweek points for a fantasy team' })
  @ApiResponse({ status: 200, description: 'Returns gameweek breakdown' })
  getGameweekPoints(@Param('id', ParseUUIDPipe) id: string) {
    return this.fantasyService.getGameweekPoints(id);
  }

  // ── Protected endpoints ───────────────────────────────────────

  @Get('my-team')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my fantasy team' })
  @ApiQuery({ name: 'competition', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Returns your fantasy team or null' })
  getMyTeam(
    @CurrentUser() user: { userId: string },
    @Query('competition') competition?: string,
  ) {
    return this.fantasyService.getMyTeam(user.userId, competition);
  }

  @Post('teams')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a fantasy team' })
  @ApiResponse({ status: 201, description: 'Fantasy team created' })
  @ApiResponse({ status: 400, description: 'Validation error or duplicate team' })
  createTeam(
    @CurrentUser() user: { userId: string },
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: CreateFantasyTeamDto,
  ) {
    return this.fantasyService.createTeam(user.userId, dto);
  }

  @Put('teams/:id/picks')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update squad picks' })
  @ApiResponse({ status: 200, description: 'Squad updated' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Not your team' })
  updatePicks(
    @CurrentUser() user: { userId: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: UpdatePicksDto,
  ) {
    return this.fantasyService.updatePicks(user.userId, id, dto);
  }

  // ── Admin endpoints ───────────────────────────────────────────

  @Post('score-round')
  @UseGuards(AdminKeyGuard)
  @ApiHeader({ name: 'x-admin-key', description: 'Admin API key' })
  @ApiOperation({ summary: 'Trigger scoring for a gameweek (admin)' })
  @ApiResponse({ status: 200, description: 'Scoring completed' })
  @ApiResponse({ status: 401, description: 'Invalid admin key' })
  scoreRound(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: ScoreRoundDto,
  ) {
    return this.scoringService.calculateGameweek(
      dto.competition ?? 'kpl',
      dto.round,
    );
  }

  // ── Per-player gameweek breakdown ─────────────────────────────

  @Get('teams/:id/gameweeks/:round/players')
  @ApiOperation({ summary: 'Get per-player point breakdown for a gameweek' })
  @ApiResponse({ status: 200, description: 'Returns player-level scoring' })
  @ApiResponse({ status: 404, description: 'Team not found' })
  getGameweekPlayerBreakdown(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('round', ParseIntPipe) round: number,
  ) {
    return this.fantasyService.getGameweekPlayerBreakdown(id, round);
  }
}
