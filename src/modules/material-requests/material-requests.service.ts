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

  // Generar folio único (MR-YYYYMMDD-XXX)
private async generateFolio(): Promise<string> {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `MR-${date}`;
  
  // Buscar el último folio del día
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

  // 1. Crear solicitud (técnico)
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
    });

    const savedRequest = await reqRepo.save(materialRequest);

    // Crear items
    const items = dto.items.map((i) =>
      itemRepo.create({
        materialRequest: savedRequest,
        item: { id: i.itemId } as any,
        quantityRequested: i.quantityRequested.toString(),
        notes: i.notes,
      }),
    );

    await itemRepo.save(items);

    // 🔥 IMPORTANTE: Buscar después de que la transacción termine
    // Usar el manager de la transacción en lugar de this.findOne
    return reqRepo.findOne({
      where: { id: savedRequest.id },
      relations: ['items', 'items.item', 'ticket', 'requestedBy'],
    });
  });
}

  // 2. Aprobar solicitud (almacenista) → genera salida automática
  async approve(id: string, dto: ApproveMaterialRequestDto, userId: string, locationId: string) {
    return this.dataSource.transaction(async (manager) => {
      const req = await this.findOne(id);

      if (req.status !== MaterialRequestStatus.PENDING) {
        throw new BadRequestException('Only pending requests can be approved');
      }

      // Actualizar cantidades aprobadas
      for (const itemDto of dto.items) {
        const reqItem = req.items.find((i) => i.item.id === itemDto.itemId);
        if (!reqItem) continue;

        reqItem.quantityApproved = itemDto.quantityApproved.toString();
        reqItem.quantityDelivered = itemDto.quantityApproved.toString();
        await manager.save(reqItem);
      }

      // Actualizar estado
      req.status = MaterialRequestStatus.APPROVED;
      req.approvedBy = { id: userId } as any;
      req.deliveredBy = { id: userId } as any;
      req.approvedAt = new Date();
      req.deliveredAt = new Date();
      await manager.save(req);

      // 🔥 Generar movimientos OUT automáticamente
      for (const item of req.items) {
        const quantityApproved = Number(item.quantityApproved);
        if (quantityApproved <= 0) continue;

        await this.stockService.move({
          itemId: item.item.id,
          locationId,
          tipo: MovementType.OUT,
          cantidad: quantityApproved,
          userId,
          ref: { tipo: 'MATERIAL_REQUEST', id: req.id },
          comentario: `Material Request ${req.folio} - Ticket ${req.ticket.id}`,
        });
      }

      return this.findOne(id);
    });
  }

  // 3. Rechazar solicitud
  async reject(id: string, dto: RejectMaterialRequestDto, userId: string) {
    const req = await this.findOne(id);

    if (req.status !== MaterialRequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be rejected');
    }

    req.status = MaterialRequestStatus.REJECTED;
    req.approvedBy = { id: userId } as any;
    req.rejectionReason = dto.rejectionReason;
    req.approvedAt = new Date();

    return this.reqRepo.save(req);
  }

  // 4. Procesar devoluciones (al cerrar ticket)
  async processReturn(dto: ReturnMaterialsDto, userId: string, locationId: string) {
    return this.dataSource.transaction(async (manager) => {
      const req = await this.findOne(dto.materialRequestId);

      // Registrar devoluciones en items
      for (const returnItem of dto.items) {
        const reqItem = req.items.find((i) => i.item.id === returnItem.itemId);
        if (!reqItem) continue;

        reqItem.quantityReturned = returnItem.quantityReturned.toString();
        await manager.save(reqItem);

        // Generar movimiento IN
        if (returnItem.quantityReturned > 0) {
          await this.stockService.move({
            itemId: returnItem.itemId,
            locationId,
            tipo: MovementType.IN,
            cantidad: returnItem.quantityReturned,
            userId,
            ref: { tipo: 'RETURN', id: req.id },
            comentario: `Return from ${req.folio}`,
          });
        }
      }

      return this.findOne(req.id);
    });
  }

  // Consultas
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

    if (!req) throw new NotFoundException('Material request not found');
    return req;
  }

  async cancel(id: string, userId: string) {
    const req = await this.findOne(id);

    if (req.status !== MaterialRequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be cancelled');
    }

    req.status = MaterialRequestStatus.CANCELLED;
    return this.reqRepo.save(req);
  }
}