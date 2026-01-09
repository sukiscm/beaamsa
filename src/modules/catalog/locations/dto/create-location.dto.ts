// src/modules/catalog/locations/dto/create-location.dto.ts
import { IsString, IsOptional, MaxLength, IsIn } from 'class-validator';

export class CreateLocationDto {
  @IsString()
  @MaxLength(120)
  nombre: string;

  @IsString()
  @MaxLength(60)
  @IsOptional()
  codigo?: string;

  @IsString()
  @IsOptional()
  @IsIn(['ALMACEN', 'TALLER', 'OFICINA', 'SUCURSAL', 'OTRO'])
  tipo?: string;

  @IsString()
  @IsOptional()
  @IsIn(['ACTIVA', 'INACTIVA'])
  status?: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsOptional()
  notas?: string;
}