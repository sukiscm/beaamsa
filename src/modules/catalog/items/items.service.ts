// src/modules/catalog/items/items.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { Item } from './entities/item.entity';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private readonly itemRepo: Repository<Item>,
  ) {}

  async create(createItemDto: CreateItemDto) {
    const item = this.itemRepo.create(createItemDto);
    return this.itemRepo.save(item);
  }

  async findAll(filters?: { search?: string; categoria?: string; status?: string }) {
    const where: any = { activo: true };

    // Filtro por búsqueda en descripción
    if (filters?.search) {
      where.descripcion = ILike(`%${filters.search}%`);
    }

    // Filtro por categoría
    if (filters?.categoria) {
      where.categoria = filters.categoria;
    }

    // Filtro por status
    if (filters?.status) {
      where.status = filters.status;
    }

    return this.itemRepo.find({
      where,
      order: { descripcion: 'ASC' },
    });
  }

  async findOne(id: string) {
    const item = await this.itemRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Item con ID ${id} no encontrado`);
    }
    return item;
  }

  async update(id: string, updateItemDto: UpdateItemDto) {
    const item = await this.findOne(id);
    Object.assign(item, updateItemDto);
    return this.itemRepo.save(item);
  }

  async remove(id: string) {
    const item = await this.findOne(id);
    item.activo = false;
    return this.itemRepo.save(item);
  }

  // Método útil para buscar por descripción (para autocomplete)
  async search(query: string, limit = 10) {
    return this.itemRepo.find({
      where: { descripcion: ILike(`%${query}%`), activo: true },
      take: limit,
      order: { descripcion: 'ASC' },
    });
  }
}