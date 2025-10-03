import { Module } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventory } from './entities/inventory.entity';
import { InventoryMovement } from '../movements/entities/movement.entity';
import { LocationsModule } from 'src/modules/catalog/locations/locations.module';

@Module({
   imports: [
    TypeOrmModule.forFeature([Inventory, InventoryMovement]),
    LocationsModule // 👈 AMBAS
  ],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService],     
})
export class StockModule {}
