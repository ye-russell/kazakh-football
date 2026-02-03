import { Controller, Get, Query, ValidationPipe } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StandingsService } from './standings.service';
import { GetStandingsDto } from './dto/get-standings.dto';

@ApiTags('standings')
@Controller('standings')
export class StandingsController {
  constructor(private readonly standingsService: StandingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get competition standings' })
  @ApiQuery({
    name: 'competition',
    required: false,
    type: String,
    description: 'Competition code (default: kpl)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns standings computed from finished matches',
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({ status: 404, description: 'Competition not found' })
  getStandings(
    @Query(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    query: GetStandingsDto,
  ) {
    return this.standingsService.getStandings(query);
  }
}
