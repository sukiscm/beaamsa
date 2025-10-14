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
import { MaterialRequestPreset } from './material-request-preset.entity'; // 👈 NUEVO

export enum MaterialRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DELIVERED = 'DELIVERED',
  PARTIAL = 'PARTIAL',
  CANCELLED = 'CANCELLED',
}

@Entity('material_requests')
export class MaterialRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Ticket, { eager: true })
  ticket: Ticket;

  @Column({ unique: true })
  folio: string;

  @Column({ type: 'enum', enum: MaterialRequestStatus, default: MaterialRequestStatus.PENDING })
  status: MaterialRequestStatus;

  // Usuarios
  @ManyToOne(() => User, { eager: true })
  requestedBy: User;

  @ManyToOne(() => User, { nullable: true, eager: true })
  approvedBy?: User;

  @ManyToOne(() => User, { nullable: true, eager: true })
  deliveredBy?: User;

  // 👇 NUEVO: Relación con preset usado
  @ManyToOne(() => MaterialRequestPreset, { nullable: true, eager: true })
  fromPreset?: MaterialRequestPreset;

  @Column({ nullable: true })
  fromPresetId?: string;

  @Column({ default: false })
  wasModifiedFromPreset: boolean; // 👈 Indica si se modificó el preset original

  // Observaciones
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  // Items
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