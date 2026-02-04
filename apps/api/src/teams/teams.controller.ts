import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TeamsService } from './teams.service';

@ApiTags('teams')
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all teams' })
  @ApiResponse({ status: 200, description: 'Returns all teams ordered by name' })
  getTeams() {
    return this.teamsService.getTeams();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get team by id' })
  @ApiParam({ name: 'id', type: String, description: 'Team UUID' })
  @ApiResponse({ status: 200, description: 'Returns team details' })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 404, description: 'Team not found' })
  getTeamById(@Param('id', ParseUUIDPipe) id: string) {
    return this.teamsService.getTeamById(id);
  }
}
