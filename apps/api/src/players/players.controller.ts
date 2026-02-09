import { Controller, Get, Param, ParseUUIDPipe, Query, ValidationPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PlayersService } from './players.service';
import { GetPlayersDto } from './dto/get-players.dto';

@ApiTags('players')
@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Get()
  @ApiOperation({ summary: 'Get players' })
  @ApiQuery({
    name: 'teamId',
    required: false,
    type: String,
    description: 'Filter by team UUID',
  })
  @ApiResponse({ status: 200, description: 'Returns players' })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  getPlayers(
    @Query(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    query: GetPlayersDto,
  ) {
    return this.playersService.getPlayers(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get player by id' })
  @ApiParam({ name: 'id', type: String, description: 'Player UUID' })
  @ApiResponse({ status: 200, description: 'Returns player details' })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 404, description: 'Player not found' })
  getPlayerById(@Param('id', ParseUUIDPipe) id: string) {
    return this.playersService.getPlayerById(id);
  }
}
