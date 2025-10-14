// src/modules/material-requests/dto/create-material-request.dto.ts
import { Type } from 'class-transformer';
import {
  IsUUID,
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
  IsNumber,
  IsPositive,
  IsBoolean,
} from 'class-validator';

export class MaterialRequestItemDto {
  @IsUUID()
  itemId: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quantityRequested: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateMaterialRequestDto {
@IsUUID()
  ticketId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaterialRequestItemDto)
  items: MaterialRequestItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;

  // 👇 NUEVO: Campos de tracking de preset
  @IsOptional()
  @IsUUID()
  fromPresetId?: string;

  @IsOptional()
  @IsBoolean()
  wasModifiedFromPreset?: boolean;
}

export class ApproveMaterialRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApproveItemDto)
  items: ApproveItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ApproveItemDto {
  @IsUUID()
  itemId: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quantityApproved: number;
}

export class RejectMaterialRequestDto {
  @IsString()
  rejectionReason: string;
}

export class ReturnMaterialsDto {
  @IsUUID()
  materialRequestId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  items: ReturnItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReturnItemDto {
  @IsUUID()
  itemId: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quantityReturned: number;
}