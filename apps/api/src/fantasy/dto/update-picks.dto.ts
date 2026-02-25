import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { FantasyPickPosition } from '@prisma/client';

export class PickItemDto {
  @IsUUID()
  playerId: string;

  @IsEnum(FantasyPickPosition)
  position: FantasyPickPosition;

  @IsOptional()
  @IsBoolean()
  isCaptain?: boolean;

  @IsOptional()
  @IsBoolean()
  isViceCaptain?: boolean;
}

export class UpdatePicksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PickItemDto)
  picks: PickItemDto[];
}
