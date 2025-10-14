// src/modules/material-requests/presets.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Item } from 'src/modules/catalog/items/entities/item.entity';
import { MaterialRequest } from '../entities/material-request.entity';
import { MaterialRequestPreset, PresetType } from '../entities/material-request-preset.entity';

@Injectable()
export class PresetsService {
constructor(
    @InjectRepository(MaterialRequestPreset)
    private presetRepo: Repository<MaterialRequestPreset>,
    @InjectRepository(MaterialRequest) // 👈 NUEVO
    private materialRequestRepo: Repository<MaterialRequest>,
    @InjectRepository(Item)
    private itemRepo: Repository<Item>,
    private dataSource: DataSource, // 👈 NUEVO
  ) {}

async findAll() {
  try {
    console.log('🔍 PresetsService.findAll() - Iniciando...');
    
    console.log('📊 Repositorio presetRepo:', !!this.presetRepo);
    
    const presets = await this.presetRepo.find({
      where: { active: true },
      order: { name: 'ASC' },
    });
    
    console.log('✅ Presets encontrados:', presets.length);
    
    return presets;
  } catch (error) {
    console.error('❌ Error en findAll():', error);
    throw error;
  }
}

  async findOne(id: string) {
    const preset = await this.presetRepo.findOne({ where: { id } });
    if (!preset) throw new NotFoundException('Preset no encontrado');
    return preset;
  }

  async findByType(type: PresetType) {
    return this.presetRepo.findOne({ where: { type, active: true } });
  }

  // Obtener preset con items completos (no solo IDs)
  async getPresetWithItems(id: string) {
    const preset = await this.findOne(id);
    
    // Cargar información completa de cada item
    const itemsWithDetails = await Promise.all(
      preset.items.map(async (presetItem) => {
        const item = await this.itemRepo.findOne({ 
          where: { id: presetItem.itemId } 
        });
        
        return {
          item: item || null,
          quantity: presetItem.quantity,
          notes: presetItem.notes,
        };
      })
    );

    // Filtrar items que ya no existen
    const validItems = itemsWithDetails.filter(i => i.item !== null);

    return {
      ...preset,
      itemsWithDetails: validItems,
    };
  }

  // Crear preset personalizado (admin)
  async create(data: {
    name: string;
    type: PresetType;
    description?: string;
    items: Array<{ itemId: string; quantity: number; notes?: string }>;
  }) {
    const preset = this.presetRepo.create(data);
    return this.presetRepo.save(preset);
  }

  // Actualizar preset
  async update(id: string, data: Partial<MaterialRequestPreset>) {
    const preset = await this.findOne(id);
    Object.assign(preset, data);
    return this.presetRepo.save(preset);
  }

  // Desactivar preset
  async deactivate(id: string) {
    const preset = await this.findOne(id);
    preset.active = false;
    return this.presetRepo.save(preset);
  }
  
  async getPresetsStats() {
    // 1. Top presets más usados
      const topPresets = await this.dataSource
      .getRepository(MaterialRequest)
      .createQueryBuilder('mr')
      .select('mr.fromPresetId', 'presetId')
      .addSelect('COUNT(*)', 'usageCount')
      .addSelect('SUM(CASE WHEN mr.wasModifiedFromPreset THEN 1 ELSE 0 END)', 'modifiedCount')
      .addSelect('SUM(CASE WHEN mr.status = :approved THEN 1 ELSE 0 END)', 'approvedCount')
      .setParameter('approved', 'APPROVED')
      .where('mr.fromPresetId IS NOT NULL')
      .groupBy('mr.fromPresetId')
      .orderBy('usageCount', 'DESC')
      .getRawMany();

    // 2. Cargar información completa de cada preset
    const presetsWithStats = await Promise.all(
      topPresets.map(async (stat) => {
        const preset = await this.presetRepo.findOne({
          where: { id: stat.presetId },
        });

        return {
          preset,
          stats: {
            totalUsage: parseInt(stat.usageCount, 10),
            modifiedUsage: parseInt(stat.modifiedCount, 10),
            approvedUsage: parseInt(stat.approvedCount, 10),
            modificationRate: (parseInt(stat.modifiedCount, 10) / parseInt(stat.usageCount, 10)) * 100,
            approvalRate: (parseInt(stat.approvedCount, 10) / parseInt(stat.usageCount, 10)) * 100,
          },
        };
      })
    );

    // 3. Estadísticas globales
    const totalRequests = await this.materialRequestRepo.count();


    // Corregir la query anterior:
    const requestsWithPreset = await this.materialRequestRepo
      .createQueryBuilder('mr')
      .where('mr.fromPresetId IS NOT NULL')
      .getCount();

    const globalStats = {
      totalRequests,
      requestsFromPreset: requestsWithPreset,
      requestsManual: totalRequests - requestsWithPreset,
      presetUsageRate: (requestsWithPreset / totalRequests) * 100,
    };

    return {
      presetsWithStats,
      globalStats,
    };
  }

  // 👇 NUEVO: Estadísticas por periodo
 async getPresetStatsByPeriod(startDate: Date, endDate: Date) {
    const stats = await this.dataSource
      .getRepository(MaterialRequest)
      .createQueryBuilder('mr')
      .select('mr.fromPresetId', 'presetId')
      .addSelect('COUNT(*)', 'usageCount')
      .addSelect('DATE(mr.createdAt)', 'date')
      .where('mr.fromPresetId IS NOT NULL')
      .andWhere('mr.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('mr.fromPresetId')
      .addGroupBy('DATE(mr.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return stats;
  }

  // 👇 NUEVO: Items más solicitados desde presets
  async getMostRequestedItemsFromPresets(limit = 10) {
    const items = await this.dataSource
      .createQueryBuilder()
      .select('mri.item_id', 'itemId')
      .addSelect('COUNT(*)', 'requestCount')
      .addSelect('SUM(CAST(mri.quantity_requested AS INTEGER))', 'totalQuantity')
      .from('material_request_items', 'mri')
      .innerJoin('material_requests', 'mr', 'mr.id = mri.material_request_id')
      .where('mr.from_preset_id IS NOT NULL')
      .groupBy('mri.item_id')
      .orderBy('requestCount', 'DESC')
      .limit(limit)
      .getRawMany();

    // Cargar información de items
    const itemsWithDetails = await Promise.all(
      items.map(async (stat) => {
        const item = await this.itemRepo.findOne({
          where: { id: stat.itemId },
        });

        return {
          item,
          requestCount: parseInt(stat.requestCount, 10),
          totalQuantity: parseInt(stat.totalQuantity, 10),
        };
      })
    );

    return itemsWithDetails;
  }
  async getPresetWithDetails(id: string) {
    const preset = await this.presetRepo.findOne({ where: { id } });
    
    if (!preset) {
      throw new NotFoundException('Preset not found');
    }

    // Cargar información completa de cada item
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
}