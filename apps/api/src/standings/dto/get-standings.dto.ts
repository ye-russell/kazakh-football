import { IsOptional, IsString } from 'class-validator';

export class GetStandingsDto {
  @IsOptional()
  @IsString()
  competition?: string = 'kpl';
}
