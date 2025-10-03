// src/modules/catalog/items/entities/item.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('items')
export class Item {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ unique: true, nullable: true })
  sku?: string;

  @Column({ length: 240 })
  descripcion: string;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
