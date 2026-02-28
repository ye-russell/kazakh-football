import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ScoreRoundDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  round: number;

  @IsOptional()
  @IsString()
  competition?: string = 'kpl';
}
