// src/modules/inventory/stock/dto/transfer.dto.ts
import { IsNotEmpty, IsNumber, IsString, IsUUID, Min } from 'class-validator';

export class TransferStockDto {
  @IsUUID()
  @IsNotEmpty()
  itemId: string;

  @IsUUID()
  @IsNotEmpty()
  fromLocationId: string;

  @IsUUID()
  @IsNotEmpty()
  toLocationId: string;

  @IsNumber()
  @Min(0.01)
  cantidad: number;

  @IsString()
  comentario?: string;
}