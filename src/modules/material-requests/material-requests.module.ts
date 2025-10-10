// src/modules/material-requests/material-requests.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialRequestsService } from './material-requests.service';
import { MaterialRequestsController } from './material-requests.controller';
import { MaterialRequest } from './entities/material-request.entity';
import { MaterialRequestItem } from './entities/material-request-item.entity';
import { StockModule } from '../inventory/stock/stock.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MaterialRequest, MaterialRequestItem]),
    StockModule, // Para usar StockService
  ],
  controllers: [MaterialRequestsController],
  providers: [MaterialRequestsService],
  exports: [MaterialRequestsService, TypeOrmModule],
})
export class MaterialRequestsModule {}