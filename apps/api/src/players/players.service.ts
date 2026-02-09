import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetPlayersDto } from './dto/get-players.dto';

@Injectable()
export class PlayersService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlayers(query: GetPlayersDto) {
    return this.prisma.player.findMany({
      where: {
        ...(query.teamId && { teamId: query.teamId }),
      },
      select: {
        id: true,
        name: true,
        number: true,
        position: true,
        team: {
          select: {
            id: true,
            name: true,
            shortName: true,
          },
        },
      },
      orderBy: [{ name: 'asc' }],
    });
  }

  async getPlayerById(id: string) {
    const player = await this.prisma.player.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        number: true,
        position: true,
        team: {
          select: {
            id: true,
            name: true,
            shortName: true,
          },
        },
      },
    });

    if (!player) {
      throw new NotFoundException(`Player with id '${id}' not found`);
    }

    return player;
  }
}
