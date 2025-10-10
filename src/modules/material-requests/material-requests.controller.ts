// src/modules/material-requests/material-requests.controller.ts
import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, Patch } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MaterialRequestsService } from './material-requests.service';
import {
  CreateMaterialRequestDto,
  ApproveMaterialRequestDto,
  RejectMaterialRequestDto,
  ReturnMaterialsDto,
} from './dto/create-material-request.dto';

@UseGuards(AuthGuard('jwt-access'))
@Controller('material-requests')
export class MaterialRequestsController {
  constructor(private readonly service: MaterialRequestsService) {}

  // Crear solicitud
  @Post()
  create(@Body() dto: CreateMaterialRequestDto, @Req() req: any) {
    return this.service.create(dto, req.user.sub);
  }

  // Listar solicitudes
  @Get()
  findAll(
    @Query('ticketId') ticketId?: string,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
  ) {
    return this.service.findAll({ ticketId, status, userId });
  }

  // Ver una solicitud
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // Aprobar solicitud (almacenista)
  @Post(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveMaterialRequestDto,
    @Req() req: any,
    @Query('locationId') locationId: string, // ID del almacén
  ) {
    return this.service.approve(id, dto, req.user.sub, locationId);
  }

  // Rechazar solicitud
  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectMaterialRequestDto, @Req() req: any) {
    return this.service.reject(id, dto, req.user.sub);
  }

  // Cancelar solicitud (técnico)
  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Req() req: any) {
    return this.service.cancel(id, req.user.sub);
  }

  // Procesar devolución
  @Post('returns')
  processReturn(@Body() dto: ReturnMaterialsDto, @Req() req: any, @Query('locationId') locationId: string) {
    return this.service.processReturn(dto, req.user.sub, locationId);
  }
}