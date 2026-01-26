// src/modules/tickets/tickets.controller.ts
import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { CloseTicketDto } from './dto/close-ticket.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('/tickets')
@UseGuards(AuthGuard('jwt-access'))
export class TicketsController {
  constructor(private readonly tickets: TicketsService) {}

  @Post()
  async create(@Body() dto: CreateTicketDto, @Req() req: any) {
    // req.user.sub lo configuraste en JwtAccessStrategy.validate(...)
    return this.tickets.create(dto, req.user.sub);
  }
  
  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.tickets.findAll({
      status,
      priority,
      search,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tickets.findOne(id);
  }

  @Post(':id/close')
  close(@Param('id') id: string, @Body() dto: CloseTicketDto, @Req() req: any) {
    return this.tickets.close(id, dto, req.user.sub);
  }
}
