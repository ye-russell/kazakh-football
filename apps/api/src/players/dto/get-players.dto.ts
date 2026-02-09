import { IsOptional, IsUUID } from 'class-validator';

export class GetPlayersDto {
  @IsOptional()
  @IsUUID()
  teamId?: string;
}
