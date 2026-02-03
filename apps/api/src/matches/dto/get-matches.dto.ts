import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetMatchesDto {
  @IsOptional()
  @IsString()
  competition?: string = 'kpl';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  round?: number;
}
