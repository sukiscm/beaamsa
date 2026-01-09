// src/modules/catalog/locations/locations.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@UseGuards(AuthGuard('jwt-access'))
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  /**
   * Crear nueva ubicación
   * POST /api/locations
   */
  @Post()
  create(@Body() createLocationDto: CreateLocationDto) {
    return this.locationsService.create(createLocationDto);
  }

  /**
   * Listar todas las ubicaciones con filtros
   * GET /api/locations?search=almacen&tipo=ALMACEN&status=ACTIVA
   */
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('tipo') tipo?: string,
    @Query('status') status?: string,
  ) {
    return this.locationsService.findAll({ search, tipo, status });
  }

  /**
   * Obtener ubicaciones activas (para selects/autocomplete)
   * GET /api/locations/active
   */
  @Get('active')
  findActive() {
    return this.locationsService.findActive();
  }

  /**
   * Buscar ubicaciones (autocomplete)
   * GET /api/locations/search?q=principal
   */
  @Get('search')
  search(@Query('q') query: string, @Query('limit') limit?: number) {
    return this.locationsService.search(query, limit ? +limit : 10);
  }

  /**
   * Obtener una ubicación específica
   * GET /api/locations/:id
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.locationsService.findOne(id);
  }

  /**
   * Actualizar ubicación
   * PATCH /api/locations/:id
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLocationDto: UpdateLocationDto) {
    return this.locationsService.update(id, updateLocationDto);
  }

  /**
   * Eliminar ubicación
   * DELETE /api/locations/:id
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.locationsService.remove(id);
  }
}