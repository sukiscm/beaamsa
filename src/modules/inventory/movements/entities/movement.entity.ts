// src/modules/inventory/movements/entities/movement.entity.ts
import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn } from 'typeorm';
import { Item } from '../../../catalog/items/entities/item.entity';
import { Location } from '../../../catalog/locations/entities/location.entity';
import { User } from '../../../users/entities/user.entity';

export enum MovementType { IN='IN', OUT='OUT', ADJUST='ADJUST' }

@Entity('inventory_movements')
export class InventoryMovement {
  @PrimaryGeneratedColumn('uuid') id: string;

  @ManyToOne(() => Item, { eager: true }) item: Item;
  @ManyToOne(() => Location, { eager: true }) location: Location;

  @Column({ type: 'enum', enum: MovementType })
  tipo: MovementType;

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  cantidad: string; // positiva

  @Column({ type: 'numeric', precision: 18, scale: 2 })
  saldo_despues: string;

  @Column({ nullable: true }) ref_tipo?: string; // 'TICKET' | 'OC' | 'AJUSTE'...
  @Column({ nullable: true }) ref_id?: string;
  @Column({ type: 'text', nullable: true }) comentario?: string;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
