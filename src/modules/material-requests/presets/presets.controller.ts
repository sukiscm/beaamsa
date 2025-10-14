// src/modules/material-requests/presets/presets.controller.ts
import { Controller, Get, Post, Body, Param, Patch, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PresetsService } from './presets.service';

@UseGuards(AuthGuard('jwt-access'))
@Controller('material-requests/presets')  // 👈 Esto está bien
export class PresetsController {
  constructor(private readonly presetsService: PresetsService) {}

  @Get()  // 👈 GET /api/material-requests/presets
  async findAll() {
    console.log('📥 GET /material-requests/presets');
    return this.presetsService.findAll();
  }

  @Get('stats/usage')  // 👈 IMPORTANTE: Antes de :id
  async getStats() {
    return this.presetsService.getPresetsStats();
  }

  @Get('stats/top-items')  // 👈 IMPORTANTE: Antes de :id
  async getTopItems(@Query('limit') limit?: string) {
    return this.presetsService.getMostRequestedItemsFromPresets(
      limit ? parseInt(limit, 10) : 10
    );
  }

  @Get('stats/period')  // 👈 IMPORTANTE: Antes de :id
  async getStatsByPeriod(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.presetsService.getPresetStatsByPeriod(
      new Date(startDate),
      new Date(endDate)
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.presetsService.getPresetWithDetails(id);
  }

  @Post()
  async create(@Body() data: any) {
    return this.presetsService.create(data);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.presetsService.update(id, data);
  }
}