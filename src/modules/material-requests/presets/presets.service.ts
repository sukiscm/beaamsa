// src/modules/material-requests/presets/presets.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Not } from 'typeorm';
import { MaterialRequestPreset, PresetType } from '../entities/material-request-preset.entity';
import { MaterialRequest } from '../entities/material-request.entity';
import { MaterialRequestItem } from '../entities/material-request-item.entity';
import { Item } from '../../catalog/items/entities/item.entity';

@Injectable()
export class PresetsService {
  constructor(
    @InjectRepository(MaterialRequestPreset)
    private presetRepo: Repository<MaterialRequestPreset>,
    @InjectRepository(MaterialRequest)
    private materialRequestRepo: Repository<MaterialRequest>,
    @InjectRepository(MaterialRequestItem)
    private materialRequestItemRepo: Repository<MaterialRequestItem>,
    @InjectRepository(Item)
    private itemRepo: Repository<Item>,
    private dataSource: DataSource,
  ) {}

  async findAll(includeInactive = false) {
    const whereCondition = includeInactive 
      ? {} 
      : { active: true };

    return this.presetRepo.find({
      where: whereCondition,
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string) {
    const preset = await this.presetRepo.findOne({ where: { id } });
    if (!preset) throw new NotFoundException('Preset not found');
    return preset;
  }

  async getPresetWithDetails(id: string) {
    const preset = await this.presetRepo.findOne({ where: { id } });
    
    if (!preset) {
      throw new NotFoundException('Preset not found');
    }

    const itemsWithDetails = await Promise.all(
      preset.items.map(async (presetItem) => {
        const item = await this.itemRepo.findOne({
          where: { id: presetItem.itemId },
        });

        return {
          ...presetItem,
          item: item || null,
        };
      })
    );

    return {
      ...preset,
      itemsWithDetails,
    };
  }

  async findByType(type: PresetType) {
    return this.presetRepo.find({
      where: { type, active: true },
      order: { name: 'ASC' },
    });
  }

  async create(data: any) {
    const preset = this.presetRepo.create(data);
    return this.presetRepo.save(preset);
  }

  async update(id: string, data: any) {
    try {
      console.log('📝 Service: Actualizando preset', id);
      
      const preset = await this.findOne(id);
      
      await this.presetRepo.update(id, {
        name: data.name,
        type: data.type,
        description: data.description,
        items: data.items,
        active: data.active,
      });
      
      console.log('✅ Service: Preset actualizado');
      
      return this.findOne(id);
    } catch (error) {
      console.error('❌ Service: Error al actualizar preset', error);
      throw error;
    }
  }

  async remove(id: string) {
    try {
      console.log('🗑️ Service: Eliminando preset', id);
      
      await this.findOne(id);
      
      await this.presetRepo.delete(id);
      
      console.log('✅ Service: Preset eliminado');
      
      return { message: 'Preset eliminado exitosamente' };
    } catch (error) {
      console.error('❌ Service: Error al eliminar preset', error);
      throw error;
    }
  }

// 👇 FIX: Estadísticas de uso
async getPresetsStats() {
  try {
    // Obtener estadísticas por preset
    const presetStats = await this.dataSource
      .createQueryBuilder(MaterialRequest, 'mr')
      .select('mr.from_preset_id', 'presetId') // 👈 snake_case
      .addSelect('COUNT(*)', 'usageCount')
      .addSelect(
        'SUM(CASE WHEN mr.was_modified_from_preset THEN 1 ELSE 0 END)', // 👈 snake_case
        'modifiedCount'
      )
      .addSelect(
        "SUM(CASE WHEN mr.status = 'APPROVED' THEN 1 ELSE 0 END)",
        'approvedCount'
      )
      .where('mr.from_preset_id IS NOT NULL') // 👈 snake_case
      .groupBy('mr.from_preset_id') // 👈 snake_case
      .orderBy('"usageCount"', 'DESC')
      .getRawMany();

    // Cargar información completa de cada preset
    const presetsWithStats = await Promise.all(
      presetStats.map(async (stat) => {
        const preset = await this.presetRepo.findOne({
          where: { id: stat.presetId },
        });

        const totalUsage = parseInt(stat.usageCount, 10);
        const modifiedUsage = parseInt(stat.modifiedCount, 10);
        const approvedUsage = parseInt(stat.approvedCount, 10);

        return {
          preset: preset || null,
          stats: {
            totalUsage,
            modifiedUsage,
            approvedUsage,
            modificationRate: totalUsage > 0 ? (modifiedUsage / totalUsage) * 100 : 0,
            approvalRate: totalUsage > 0 ? (approvedUsage / totalUsage) * 100 : 0,
          },
        };
      })
    );

    // Estadísticas globales
    const totalRequests = await this.materialRequestRepo.count();
    
    const requestsFromPreset = await this.materialRequestRepo
      .createQueryBuilder('mr')
      .where('mr.from_preset_id IS NOT NULL') // 👈 snake_case
      .getCount();
    
    const requestsManual = totalRequests - requestsFromPreset;

    const globalStats = {
      totalRequests,
      requestsFromPreset,
      requestsManual,
      presetUsageRate:
        totalRequests > 0 ? (requestsFromPreset / totalRequests) * 100 : 0,
    };

    return {
      presetsWithStats,
      globalStats,
    };
  } catch (error) {
    console.error('❌ Error en getPresetsStats:', error);
    throw error;
  }
}

// 👇 FIX: Items más solicitados
async getMostRequestedItemsFromPresets(limit = 10) {
  try {
    const topItems = await this.dataSource
      .createQueryBuilder(MaterialRequestItem, 'mri')
      .select('mri.item_id', 'itemId') // 👈 CAMBIAR a snake_case
      .addSelect('COUNT(*)', 'requestCount')
      .addSelect('SUM(CAST(mri.quantity_requested AS INTEGER))', 'totalQuantity') // 👈 snake_case
      .innerJoin('mri.materialRequest', 'mr')
      .where('mr.from_preset_id IS NOT NULL') // 👈 snake_case
      .groupBy('mri.item_id') // 👈 CAMBIAR a snake_case
      .orderBy('"requestCount"', 'DESC')
      .limit(limit)
      .getRawMany();

    // Cargar información completa de cada item
    const topItemsWithDetails = await Promise.all(
      topItems.map(async (topItem) => {
        const item = await this.itemRepo.findOne({
          where: { id: topItem.itemId },
        });

        return {
          item: item || null,
          requestCount: parseInt(topItem.requestCount, 10),
          totalQuantity: parseInt(topItem.totalQuantity, 10),
        };
      })
    );

    return topItemsWithDetails;
  } catch (error) {
    console.error('❌ Error en getMostRequestedItemsFromPresets:', error);
    throw error;
  }
}

// 👇 FIX: Estadísticas por periodo
async getPresetStatsByPeriod(startDate: Date, endDate: Date) {
  try {
    const presetStats = await this.dataSource
      .createQueryBuilder(MaterialRequest, 'mr')
      .select('mr.from_preset_id', 'presetId') // 👈 snake_case
      .addSelect('COUNT(*)', 'usageCount')
      .addSelect('DATE(mr.created_at)', 'date') // 👈 snake_case
      .where('mr.from_preset_id IS NOT NULL') // 👈 snake_case
      .andWhere('mr.created_at BETWEEN :startDate AND :endDate', { // 👈 snake_case
        startDate,
        endDate,
      })
      .groupBy('mr.from_preset_id') // 👈 snake_case
      .addGroupBy('DATE(mr.created_at)') // 👈 snake_case
      .orderBy('DATE(mr.created_at)', 'ASC') // 👈 snake_case
      .getRawMany();

    return presetStats;
  } catch (error) {
    console.error('❌ Error en getPresetStatsByPeriod:', error);
    throw error;
  }
}
}