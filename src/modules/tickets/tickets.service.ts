// src/modules/tickets/tickets.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Ticket, TicketStatus } from './entities/ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UsersService } from '../users/users.service';
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
    private users: UsersService,
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
    return ticket; // si quieres 404, lanza NotFound si viene null
  }

}
