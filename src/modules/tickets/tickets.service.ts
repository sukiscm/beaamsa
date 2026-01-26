// src/modules/tickets/tickets.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, Repository } from 'typeorm';
import { Ticket, TicketStatus } from './entities/ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { CloseTicketDto } from './dto/close-ticket.dto';
import { UsersService } from '../users/users.service';
import { MaterialRequestItem } from '../material-requests/entities/material-request-item.entity';
import { StockService } from '../inventory/stock/stock.service';
import { MovementType } from '../inventory/movements/entities/movement.entity';

type ListParams = {
  status?: string;
  priority?: string;
  search?: string;
  page: number;
  limit: number;
};

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket) private repo: Repository<Ticket>,
    @InjectRepository(MaterialRequestItem) private itemRepo: Repository<MaterialRequestItem>,
    private users: UsersService,
    private stockService: StockService,
    private dataSource: DataSource,
  ) {}

  async create(dto: CreateTicketDto, requesterId: string) {
    const requester = await this.users.findOne(requesterId);
    const ticket = this.repo.create({
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      location: dto.location,
      dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
      status: TicketStatus.OPEN,
      requestedBy: requester,
    });
    return this.repo.save(ticket);
  }

async findAll(params: ListParams) {
    const { status, priority, search, page, limit } = params;
    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (search) {
      // busca en title/description (ILIKE para Postgres)
      where.title = ILike(`%${search}%`);
      // Si quieres OR en title/description: usa un QueryBuilder (opcional)
    }

    const [items, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const ticket = await this.repo.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');
    return ticket;
  }

  async close(id: string, dto: CloseTicketDto, userId: string) {
    console.log('\n🔒 ===== CERRANDO TICKET =====');
    console.log('Ticket ID:', id);
    console.log('Location ID:', dto.locationId);
    console.log('Returns:', dto.returns);

    return this.dataSource.transaction(async (manager) => {
      const ticketRepo = manager.getRepository(Ticket);
      const itemRepo = manager.getRepository(MaterialRequestItem);

      // 1) Validar que el ticket existe y no está cerrado
      const ticket = await ticketRepo.findOne({ where: { id } });

      if (!ticket) {
        throw new NotFoundException('Ticket no encontrado');
      }

      if (ticket.status === TicketStatus.DONE) {
        throw new BadRequestException('El ticket ya está cerrado');
      }

      if (ticket.status === TicketStatus.CANCELED) {
        throw new BadRequestException('El ticket está cancelado');
      }

      // 2) Procesar devoluciones si hay items
      const hasReturns = dto.returns && dto.returns.length > 0;
      const hasQuantitiesToReturn = hasReturns && dto.returns.some(r => r.quantityReturned > 0);

      if (hasQuantitiesToReturn) {
        // Validar que se proporcionó ubicación destino
        if (!dto.locationId) {
          throw new BadRequestException('Se requiere una ubicación destino para las devoluciones');
        }

        console.log('\n📦 Procesando devoluciones...');

        for (const returnItem of dto.returns) {
          if (returnItem.quantityReturned <= 0) continue;

          // Buscar el MaterialRequestItem
          const mrItem = await itemRepo.findOne({
            where: { id: returnItem.materialRequestItemId },
            relations: ['item', 'materialRequest', 'materialRequest.ticket'],
          });

          if (!mrItem) {
            console.warn(`⚠️ Item ${returnItem.materialRequestItemId} no encontrado, saltando...`);
            continue;
          }

          // Validar que el item pertenece a este ticket
          if (mrItem.materialRequest.ticket.id !== id) {
            throw new BadRequestException(
              `El item ${returnItem.materialRequestItemId} no pertenece a este ticket`
            );
          }

          // Calcular cantidad disponible para devolver
          const delivered = parseFloat(mrItem.quantityDelivered || '0');
          const alreadyReturned = parseFloat(mrItem.quantityReturned || '0');
          const available = delivered - alreadyReturned;

          if (returnItem.quantityReturned > available) {
            throw new BadRequestException(
              `No se puede devolver ${returnItem.quantityReturned} de ${mrItem.item.descripcion}. Disponible: ${available}`
            );
          }

          console.log(`➡️ Devolviendo ${returnItem.quantityReturned} de ${mrItem.item.descripcion}`);

          // Actualizar quantityReturned en el item
          const newReturned = alreadyReturned + returnItem.quantityReturned;
          mrItem.quantityReturned = newReturned.toFixed(2);
          await itemRepo.save(mrItem);

          // Crear movimiento IN en inventario
          await this.stockService.move({
            itemId: mrItem.item.id,
            locationId: dto.locationId,
            tipo: MovementType.IN,
            cantidad: returnItem.quantityReturned,
            userId,
            ref: { tipo: 'TICKET_CLOSE', id: id },
            comentario: dto.comment
              ? `Cierre de ticket: ${dto.comment}`
              : `Devolución al cerrar ticket ${ticket.title}`,
          });

          console.log(`✅ Devolución procesada para ${mrItem.item.descripcion}`);
        }
      }

      // 3) Cambiar status del ticket a DONE
      ticket.status = TicketStatus.DONE;
      await ticketRepo.save(ticket);

      console.log('\n✅ ===== TICKET CERRADO EXITOSAMENTE =====\n');

      return this.findOne(id);
    });
  }
}
