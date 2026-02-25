import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class CreateFantasyTeamDto {
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  name: string;

  @IsOptional()
  @IsString()
  competition?: string = 'kpl';
}
