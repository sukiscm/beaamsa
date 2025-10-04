
// src/modules/catalog/items/entities/item.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('items')
export class Item {
  @PrimaryGeneratedColumn('uuid') 
  id: string;

  @Column({ length: 500 })
  descripcion: string;

  @Column({ length: 100, nullable: true })
  serie?: string;

  @Column({ length: 100, nullable: true })
  categoria?: string;

  @Column({ length: 100, nullable: true })
  proceso?: string;

  @Column({ length: 50, default: 'EN OPERACIÓN' })
  status: string;

  @Column({ type: 'integer', default: 0 })
  inventario: number;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn() 
  createdAt: Date;
  
  @UpdateDateColumn() 
  updatedAt: Date;
}