import { Controller, Get, Query, ValidationPipe } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { GetStatsDto } from './dto/get-stats.dto';

@ApiTags('stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  @ApiOperation({ summary: 'Get league statistics' })
  @ApiQuery({
    name: 'competition',
    required: false,
    type: String,
    description: 'Competition code (default: kpl)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns top scorers, assists, cards, and clean sheets for the competition',
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({ status: 404, description: 'Competition not found' })
  getStats(
    @Query(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    query: GetStatsDto,
  ) {
    return this.statsService.getStats(query);
  }
}
