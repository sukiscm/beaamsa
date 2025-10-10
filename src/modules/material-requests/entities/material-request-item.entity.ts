// src/modules/material-requests/entities/material-request-item.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';
import { MaterialRequest } from './material-request.entity';
import { Item } from '../../catalog/items/entities/item.entity';

@Entity('material_request_items')
export class MaterialRequestItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MaterialRequest, (req) => req.items, { onDelete: 'CASCADE' })
  materialRequest: MaterialRequest;

  @ManyToOne(() => Item, { eager: true })
  item: Item;

  // Cantidades
  @Column({ type: 'numeric', precision: 18, scale: 2 })
  quantityRequested: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  quantityApproved: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  quantityDelivered: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0, nullable: true })
  quantityReturned?: string; // Para el checklist de cierre

  // Observaciones específicas del item
  @Column({ type: 'text', nullable: true })
  notes?: string;
}