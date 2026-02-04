import { Controller, Get, Param, ParseUUIDPipe, Query, ValidationPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MatchesService } from './matches.service';
import { GetMatchesDto } from './dto/get-matches.dto';

@ApiTags('matches')
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  @ApiOperation({ summary: 'Get matches' })
  @ApiQuery({
    name: 'competition',
    required: false,
    type: String,
    description: 'Competition code (default: kpl)',
  })
  @ApiQuery({
    name: 'round',
    required: false,
    type: Number,
    description: 'Round number',
  })
  @ApiResponse({ status: 200, description: 'Returns matches' })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({ status: 404, description: 'Competition not found' })
  getMatches(
    @Query(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    query: GetMatchesDto,
  ) {
    return this.matchesService.getMatches(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get match by id' })
  @ApiParam({ name: 'id', type: String, description: 'Match UUID' })
  @ApiResponse({ status: 200, description: 'Returns match details' })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  getMatchById(@Param('id', ParseUUIDPipe) id: string) {
    return this.matchesService.getMatchById(id);
  }
}
