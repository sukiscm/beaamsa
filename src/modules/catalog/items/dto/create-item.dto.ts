// src/modules/catalog/items/dto/create-item.dto.ts
import { IsString, IsOptional, IsBoolean, IsInt, Min, MaxLength } from 'class-validator';

export class CreateItemDto {
  @IsString()
  @MaxLength(500)
  descripcion: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  serie?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  categoria?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  proceso?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  inventario?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}