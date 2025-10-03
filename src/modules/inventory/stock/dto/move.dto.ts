// src/modules/inventory/stock/dto/move.dto.ts
import { IsUUID, IsNumber, IsPositive, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class MoveBaseDto {
  @IsUUID() itemId: string;
  @IsUUID() locationId: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  cantidad: number;

  @IsOptional()
  @IsString()
  comentario?: string;

  @IsOptional()
  ref?: { tipo?: string; id?: string };
}

export class InDto extends MoveBaseDto {}
export class OutDto extends MoveBaseDto {}
export class AdjustDto {
  @IsUUID() itemId: string;
  @IsUUID() locationId: string;
  @Type(() => Number) @IsNumber() @Min(0) cantidad: number; // “set to”
  @IsString() comentario: string; // obliga comentario en ajuste
}
