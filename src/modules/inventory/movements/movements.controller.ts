// src/modules/inventory/movements/movements.controller.ts
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StockService } from '../stock/stock.service';

@UseGuards(AuthGuard('jwt-access'))
@Controller('inventory')
export class MovementsController {
constructor(private readonly stock: StockService) {}

  @Get(':itemId/movements')
  byItem(@Param('itemId') itemId: string) {
    return this.stock.findMovements(itemId);
  }
}
