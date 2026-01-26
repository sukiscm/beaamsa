// src/modules/material-requests/material-requests.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { MaterialRequest, MaterialRequestStatus } from './entities/material-request.entity';
import { MaterialRequestItem } from './entities/material-request-item.entity';
import { StockService } from '../inventory/stock/stock.service';
import { MovementType } from '../inventory/movements/entities/movement.entity';
import {
  CreateMaterialRequestDto,
  ApproveMaterialRequestDto,
  RejectMaterialRequestDto,
  ReturnMaterialsDto,
} from './dto/create-material-request.dto';

@Injectable()
export class MaterialRequestsService {
  constructor(
    @InjectRepository(MaterialRequest)
    private reqRepo: Repository<MaterialRequest>,
    @InjectRepository(MaterialRequestItem)
    private reqItemRepo: Repository<MaterialRequestItem>,
    private stockService: StockService,
    private dataSource: DataSource,
  ) {}

  private async generateFolio(): Promise<string> {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `MR-${date}`;
    
    const lastRequest = await this.reqRepo
      .createQueryBuilder('mr')
      .where('mr.folio LIKE :prefix', { prefix: `${prefix}-%` })
      .orderBy('mr.folio', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastRequest) {
      const lastNumber = parseInt(lastRequest.folio.split('-').pop() || '0', 10);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}-${String(nextNumber).padStart(3, '0')}`;
  }

  async create(dto: CreateMaterialRequestDto, userId: string) {
    return this.dataSource.transaction(async (manager) => {
      const reqRepo = manager.getRepository(MaterialRequest);
      const itemRepo = manager.getRepository(MaterialRequestItem);

      const folio = await this.generateFolio();

      const materialRequest = reqRepo.create({
        folio,
        ticket: { id: dto.ticketId } as any,
        requestedBy: { id: userId } as any,
        notes: dto.notes,
        status: MaterialRequestStatus.PENDING,
        fromPresetId: dto.fromPresetId,
        wasModifiedFromPreset: dto.wasModifiedFromPreset || false,
      });

      const savedRequest = await reqRepo.save(materialRequest);

      const items = dto.items.map((i) =>
        itemRepo.create({
          materialRequest: savedRequest,
          item: { id: i.itemId } as any,
          quantityRequested: i.quantityRequested.toString(),
          notes: i.notes,
        }),
      );

      await itemRepo.save(items);

      return reqRepo.findOne({
        where: { id: savedRequest.id },
        relations: ['items', 'items.item', 'ticket', 'requestedBy'],
      });
    });
  }

  async approve(id: string, dto: ApproveMaterialRequestDto, userId: string, locationId: string) {
    console.log('\n🔍 ===== INICIANDO APROBACIÓN =====');
    console.log('Request ID:', id);
    console.log('Location ID:', locationId);
    console.log('Items a aprobar:', dto.items);

    return this.dataSource.transaction(async (manager) => {
      const req = await this.findOne(id);

      if (req.status !== MaterialRequestStatus.PENDING) {
        throw new BadRequestException('Solo se pueden aprobar solicitudes pendientes');
      }

      // 🔥 NUEVA VALIDACIÓN: Verificar stock disponible ANTES de aprobar
      console.log('\n📊 Verificando stock disponible...');
      
      const stockErrors: string[] = [];
      
      for (const itemDto of dto.items) {
        const availableStock = await this.stockService.checkStock(itemDto.itemId, locationId);
        
        console.log(`Item ${itemDto.itemId}: Disponible=${availableStock}, Solicitado=${itemDto.quantityApproved}`);
        
        if (availableStock < itemDto.quantityApproved) {
          const reqItem = req.items.find((i) => i.item.id === itemDto.itemId);
          const itemName = reqItem?.item?.descripcion || itemDto.itemId;
          
          stockErrors.push(
            `${itemName}: Stock insuficiente (Disponible: ${availableStock}, Solicitado: ${itemDto.quantityApproved})`
          );
        }
      }

      if (stockErrors.length > 0) {
        console.error('❌ Errores de stock:', stockErrors);
        throw new BadRequestException(
          `No hay stock suficiente:\n${stockErrors.join('\n')}`
        );
      }

      console.log('✅ Stock verificado, procediendo con la aprobación...');

      // Actualizar cantidades aprobadas y determinar si es entrega total o parcial
      let isPartial = false;

      for (const itemDto of dto.items) {
        const reqItem = req.items.find((i) => i.item.id === itemDto.itemId);
        if (!reqItem) continue;

        const requested = parseFloat(reqItem.quantityRequested || '0');
        const approved = itemDto.quantityApproved;

        // Si se aprobó menos de lo solicitado, es entrega parcial
        if (approved < requested) {
          isPartial = true;
        }

        reqItem.quantityApproved = approved.toString();
        reqItem.quantityDelivered = approved.toString();
        await manager.save(reqItem);
      }

      // Actualizar estado: DELIVERED si se entregó todo, PARTIAL si no
      req.status = isPartial ? MaterialRequestStatus.PARTIAL : MaterialRequestStatus.DELIVERED;
      req.approvedBy = { id: userId } as any;
      req.deliveredBy = { id: userId } as any;
      req.approvedAt = new Date();
      req.deliveredAt = new Date();
      await manager.save(req);

      console.log('\n📦 Generando movimientos OUT...');

      // Generar movimientos OUT automáticamente
      for (const item of req.items) {
        const quantityApproved = parseFloat(item.quantityApproved || '0');
        
        if (quantityApproved <= 0) {
          console.log(`⏭️ Saltando item ${item.item.id} (cantidad = 0)`);
          continue;
        }

        console.log(`➡️ Procesando salida: Item=${item.item.id}, Cantidad=${quantityApproved}`);

        try {
          await this.stockService.move({
            itemId: item.item.id,
            locationId,
            tipo: MovementType.OUT,
            cantidad: quantityApproved,
            userId,
            ref: { tipo: 'MATERIAL_REQUEST', id: req.id },
            comentario: `Material Request ${req.folio} - Ticket ${req.ticket.id}`,
          });
          
          console.log(`✅ Movimiento OUT exitoso para item ${item.item.id}`);
        } catch (error) {
          console.error(`❌ Error en movimiento OUT para item ${item.item.id}:`, error);
          throw error; // Propagar error para rollback
        }
      }

      console.log('\n✅ ===== APROBACIÓN COMPLETADA =====\n');

      return this.findOne(id);
    });
  }

  async reject(id: string, dto: RejectMaterialRequestDto, userId: string) {
    const req = await this.findOne(id);

    if (req.status !== MaterialRequestStatus.PENDING) {
      throw new BadRequestException('Solo se pueden rechazar solicitudes pendientes');
    }

    req.status = MaterialRequestStatus.REJECTED;
    req.approvedBy = { id: userId } as any;
    req.rejectionReason = dto.rejectionReason;
    req.approvedAt = new Date();

    return this.reqRepo.save(req);
  }

  async processReturn(dto: ReturnMaterialsDto, userId: string, locationId: string) {
    return this.dataSource.transaction(async (manager) => {
      const req = await this.findOne(dto.materialRequestId);

      for (const returnItem of dto.items) {
        const reqItem = req.items.find((i) => i.item.id === returnItem.itemId);
        if (!reqItem) continue;

        reqItem.quantityReturned = returnItem.quantityReturned.toString();
        await manager.save(reqItem);

        if (returnItem.quantityReturned > 0) {
          await this.stockService.move({
            itemId: returnItem.itemId,
            locationId,
            tipo: MovementType.IN,
            cantidad: returnItem.quantityReturned,
            userId,
            ref: { tipo: 'RETURN', id: req.id },
            comentario: `Devolución de ${req.folio}`,
          });
        }
      }

      return this.findOne(req.id);
    });
  }

  async findAll(filters?: { ticketId?: string; status?: string; userId?: string }) {
    const where: any = {};
    if (filters?.ticketId) where.ticket = { id: filters.ticketId };
    if (filters?.status) where.status = filters.status;
    if (filters?.userId) where.requestedBy = { id: filters.userId };

    return this.reqRepo.find({
      where,
      relations: ['items', 'items.item'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const req = await this.reqRepo.findOne({
      where: { id },
      relations: ['items', 'items.item', 'ticket', 'requestedBy', 'approvedBy'],
    });

    if (!req) throw new NotFoundException('Solicitud de material no encontrada');
    return req;
  }

  async cancel(id: string, userId: string) {
    const req = await this.findOne(id);

    if (req.status !== MaterialRequestStatus.PENDING) {
      throw new BadRequestException('Solo se pueden cancelar solicitudes pendientes');
    }

    req.status = MaterialRequestStatus.CANCELLED;
    return this.reqRepo.save(req);
  }
}