// src/modules/inventory/inventory.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventory } from './stock/entities/inventory.entity';
import { InventoryMovement } from './movements/entities/movement.entity';
import { StockService } from './stock/stock.service';
import { StockController } from './stock/stock.controller';
import { MovementsController } from './movements/movements.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Inventory, InventoryMovement])],
  controllers: [StockController, MovementsController],
  providers: [StockService],
  exports: [TypeOrmModule, StockService],
})
export class InventoryModule {}
