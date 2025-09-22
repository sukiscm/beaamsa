// src/modules/tickets/dto/create-ticket.dto.ts
import { IsEnum, IsOptional, IsString, IsDateString, MaxLength } from 'class-validator';
import { TicketPriority } from '../entities/ticket.entity';

export class CreateTicketDto {
  @IsString()
  @MaxLength(120)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority; // default en entidad

  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string; // ISO string
}
