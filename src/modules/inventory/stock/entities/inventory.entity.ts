// src/modules/inventory/stock/entities/inventory.entity.ts
import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, Unique, UpdateDateColumn } from 'typeorm';
import { Item } from '../../../catalog/items/entities/item.entity';
import { Location } from '../../../catalog/locations/entities/location.entity';

@Entity('inventory')
@Unique(['item','location'])
export class Inventory {
  @PrimaryGeneratedColumn('uuid') id: string;

  @ManyToOne(() => Item, { eager: true })
  item: Item;

  @ManyToOne(() => Location, { eager: true })
  location: Location;

  // usa numeric como string para evitar problemas float; o integer si trabajas solo en piezas
  @Column({ type: 'numeric', precision: 18, scale: 2, default: 0 })
  cantidad: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
