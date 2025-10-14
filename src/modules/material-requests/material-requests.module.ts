// src/modules/material-requests/material-requests.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialRequestsService } from './material-requests.service';
import { MaterialRequestsController } from './material-requests.controller';
import { MaterialRequest } from './entities/material-request.entity';
import { MaterialRequestItem } from './entities/material-request-item.entity';
import { MaterialRequestPreset } from './entities/material-request-preset.entity';
import { StockModule } from '../inventory/stock/stock.module';
import { ItemsModule } from '../catalog/items/items.module';
import { PresetsService } from './presets/presets.service';
import { PresetsController } from './presets/presets.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MaterialRequest,
      MaterialRequestItem,
      MaterialRequestPreset,  // 👈 CRÍTICO
    ]),
    StockModule,
    ItemsModule,
  ],
  controllers: [
    PresetsController,  // 👈 CRÍTICO
    MaterialRequestsController,
  ],
  providers: [
    MaterialRequestsService,
    PresetsService,  // 👈 CRÍTICO
  ],
  exports: [
    MaterialRequestsService,
    PresetsService,
    TypeOrmModule,
  ],
})
export class MaterialRequestsModule {}