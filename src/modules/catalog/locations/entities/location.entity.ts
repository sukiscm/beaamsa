// src/modules/catalog/locations/entities/location.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('locations')
export class Location {
  @PrimaryGeneratedColumn('uuid') 
  id: string;

  @Column({ length: 120 })
  nombre: string;

  @Column({ length: 60, nullable: true })
  codigo?: string;

  @Column({ 
    length: 60, 
    nullable: true,
    default: 'ALMACEN',
    comment: 'ALMACEN | TALLER | OFICINA | SUCURSAL | OTRO'
  })
  tipo?: string;

  @Column({ 
    length: 60, 
    nullable: true,
    default: 'ACTIVA',
    comment: 'ACTIVA | INACTIVA'
  })
  status?: string;

  @Column({ type: 'text', nullable: true })
  direccion?: string;

  @Column({ type: 'text', nullable: true })
  notas?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}