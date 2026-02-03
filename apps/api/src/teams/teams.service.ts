import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTeams() {
    return this.prisma.team.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }
}
