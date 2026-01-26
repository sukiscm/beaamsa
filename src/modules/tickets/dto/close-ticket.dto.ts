// src/modules/tickets/dto/close-ticket.dto.ts
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReturnItemDto {
  @IsUUID()
  materialRequestItemId: string;

  @IsNumber()
  @Min(0)
  quantityReturned: number;
}

export class CloseTicketDto {
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  returns: ReturnItemDto[];
}
