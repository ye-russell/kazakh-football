import { IsOptional, IsString } from 'class-validator';

export class GetStatsDto {
  @IsOptional()
  @IsString()
  competition?: string = 'kpl';
}
