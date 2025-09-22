// src/modules/tickets/entities/ticket.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  CANCELED = 'CANCELED',
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: TicketPriority, default: TicketPriority.MEDIUM })
  priority: TicketPriority;

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.OPEN })
  status: TicketStatus;

  // Ejemplos de campos útiles para mantenimiento de climas
  @Column({ length: 120, nullable: true })
  location?: string; // sucursal / sala / tech room

  @Column({ type: 'timestamp', nullable: true })
  dueAt?: Date; // fecha objetivo (opcional)

  @ManyToOne(() => User, { nullable: false, eager: true })
  requestedBy: User; // quien crea el ticket

  @ManyToOne(() => User, { nullable: true, eager: true })
  assignedTo?: User; // técnico asignado (opcional en esta fase)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
