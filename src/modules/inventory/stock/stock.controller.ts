// src/modules/inventory/stock/stock.controller.ts
import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StockService } from './stock.service';
import { MovementType } from '../movements/entities/movement.entity';
import { AdjustDto, InDto, OutDto } from './dto/move.dto';

@UseGuards(AuthGuard('jwt-access'))
@Controller('inventory')
export class StockController {
  constructor(private readonly stock: StockService) {}

  @Get()
  list(@Query('itemId') itemId?: string, @Query('locationId') locationId?: string) {
    return this.stock.findStock(itemId, locationId);
  }

  @Post('in')
  in(@Body() dto: InDto, @Req() req: any) {
    return this.stock.move({ ...dto, tipo: MovementType.IN, userId: req.user.sub });
  }

  @Post('out')
  out(@Body() dto: OutDto, @Req() req: any) {
    return this.stock.move({ ...dto, tipo: MovementType.OUT, userId: req.user.sub });
  }

  @Post('adjust')
  adjust(@Body() dto: AdjustDto, @Req() req: any) {
    return this.stock.move({ ...dto, tipo: MovementType.ADJUST, userId: req.user.sub, ref: { tipo: 'AJUSTE' } });
  }
}
