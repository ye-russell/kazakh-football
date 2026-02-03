import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LeagueService } from './league.service';

@ApiTags('league')
@Controller('league')
export class LeagueController {
  constructor(private readonly leagueService: LeagueService) {}

  @Get()
  @ApiOperation({ summary: 'Get Kazakh Football league information' })
  @ApiResponse({ status: 200, description: 'Returns league information' })
  getLeague() {
    return this.leagueService.getLeagueInfo();
  }
}
