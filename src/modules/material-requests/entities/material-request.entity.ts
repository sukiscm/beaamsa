// src/modules/material-requests/entities/material-request.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { User } from '../../users/entities/user.entity';
import { MaterialRequestItem } from './material-request-item.entity';

export enum MaterialRequestStatus {
  PENDING = 'PENDING',           // Creada, esperando aprobación
  APPROVED = 'APPROVED',         // Aprobada por almacenista
  REJECTED = 'REJECTED',         // Rechazada
  DELIVERED = 'DELIVERED',       // Materiales entregados
  PARTIAL = 'PARTIAL',           // Entrega parcial
  CANCELLED = 'CANCELLED',       // Cancelada por técnico
}

@Entity('material_requests')
export class MaterialRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relación con ticket
  @ManyToOne(() => Ticket, { eager: true })
  ticket: Ticket;

  // Folio/número de requisición
  @Column({ unique: true })
  folio: string;

  // Estado
  @Column({ type: 'enum', enum: MaterialRequestStatus, default: MaterialRequestStatus.PENDING })
  status: MaterialRequestStatus;

  // Usuarios involucrados
  @ManyToOne(() => User, { eager: true })
  requestedBy: User; // Técnico que solicita

  @ManyToOne(() => User, { nullable: true, eager: true })
  approvedBy?: User; // Almacenista que aprueba

  @ManyToOne(() => User, { nullable: true, eager: true })
  deliveredBy?: User; // Quien entrega físicamente

  // Observaciones
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  // Items solicitados (relación)
  @OneToMany(() => MaterialRequestItem, (item) => item.materialRequest, { cascade: true })
  items: MaterialRequestItem[];

  // Fechas
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt?: Date;
}