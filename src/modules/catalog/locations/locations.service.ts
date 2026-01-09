// src/modules/catalog/locations/locations.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Location } from './entities/location.entity';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepo: Repository<Location>,
  ) {}

  /**
   * Crear nueva ubicación/almacén
   */
  async create(createLocationDto: CreateLocationDto) {
    const location = this.locationRepo.create(createLocationDto);
    return this.locationRepo.save(location);
  }

  /**
   * Listar todas las ubicaciones con filtros opcionales
   */
  async findAll(filters?: { search?: string; tipo?: string; status?: string }) {
    const where: any = {};

    // Filtro por búsqueda en nombre o código
    if (filters?.search) {
      // Para búsqueda más flexible, usar query builder
      return this.locationRepo
        .createQueryBuilder('location')
        .where('location.nombre ILIKE :search', { search: `%${filters.search}%` })
        .orWhere('location.codigo ILIKE :search', { search: `%${filters.search}%` })
        .orderBy('location.nombre', 'ASC')
        .getMany();
    }

    // Filtro por tipo
    if (filters?.tipo) {
      where.tipo = filters.tipo;
    }

    // Filtro por status
    if (filters?.status) {
      where.status = filters.status;
    }

    return this.locationRepo.find({
      where,
      order: { nombre: 'ASC' },
    });
  }

  /**
   * Obtener una ubicación por ID
   */
  async findOne(id: string) {
    const location = await this.locationRepo.findOne({ where: { id } });
    
    if (!location) {
      throw new NotFoundException(`Location con ID ${id} no encontrada`);
    }
    
    return location;
  }

  /**
   * Actualizar ubicación
   */
  async update(id: string, updateLocationDto: UpdateLocationDto) {
    const location = await this.findOne(id);
    
    Object.assign(location, updateLocationDto);
    
    return this.locationRepo.save(location);
  }

  /**
   * Eliminar ubicación (soft delete - cambia status a INACTIVA)
   */
  async remove(id: string) {
    const location = await this.findOne(id);
    
    // Verificar si tiene inventario asociado
    const hasInventory = await this.locationRepo
      .createQueryBuilder('location')
      .leftJoin('inventory', 'inv', 'inv.location_id = location.id')
      .where('location.id = :id', { id })
      .andWhere('inv.cantidad > 0')
      .getCount();

    if (hasInventory > 0) {
      // Soft delete - no eliminar físicamente si tiene inventario
      location.status = 'INACTIVA';
      return this.locationRepo.save(location);
    }

    // Si no tiene inventario, eliminar físicamente
    return this.locationRepo.remove(location);
  }

  /**
   * Buscar ubicaciones por nombre (para autocomplete)
   */
  async search(query: string, limit = 10) {
    return this.locationRepo.find({
      where: [
        { nombre: ILike(`%${query}%`), status: 'ACTIVA' },
        { codigo: ILike(`%${query}%`), status: 'ACTIVA' },
      ],
      take: limit,
      order: { nombre: 'ASC' },
    });
  }

  /**
   * Obtener ubicaciones activas
   */
  async findActive() {
    return this.locationRepo.find({
      where: { status: 'ACTIVA' },
      order: { nombre: 'ASC' },
    });
  }
}