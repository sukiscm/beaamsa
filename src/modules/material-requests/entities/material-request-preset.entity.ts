// src/modules/material-requests/entities/material-request-preset.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PresetType {
  MANTENIMIENTO_GENERAL = 'MANTENIMIENTO_GENERAL',
  INSTALACION_MINISPLIT = 'INSTALACION_MINISPLIT',
  REPARACION_URGENTE = 'REPARACION_URGENTE',
  LIMPIEZA_PROFUNDA = 'LIMPIEZA_PROFUNDA',
}

export interface PresetItem {
  itemId: string;
  quantity: number;
  notes?: string;
}

@Entity('material_request_presets')
export class MaterialRequestPreset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  name: string;

  @Column({ type: 'enum', enum: PresetType })
  type: PresetType;

  @Column({ type: 'text', nullable: true })
  description?: string;

  // JSON con array de items predefinidos
  @Column({ type: 'jsonb' })
  items: PresetItem[];

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}