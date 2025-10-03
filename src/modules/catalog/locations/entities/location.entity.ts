// src/modules/catalog/locations/entities/location.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('locations')
export class Location {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ length: 120 })
  nombre: string;

  @Column({ length: 60, nullable: true })
  codigo?: string;
}
