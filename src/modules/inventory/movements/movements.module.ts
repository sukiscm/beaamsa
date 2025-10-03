import { Module } from '@nestjs/common';
import { MovementsService } from './movements.service';
import { MovementsController } from './movements.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryMovement } from './entities/movement.entity';
import { StockModule } from '../stock/stock.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InventoryMovement]), // si lo usas aquí
    StockModule,                                   // 👈 trae StockService
  ],
  controllers: [MovementsController],
  providers: [MovementsService],
})
export class MovementsModule {}
