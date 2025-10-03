// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDataSourceOptions } from './database/data-source';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { ItemsModule } from './modules/catalog/items/items.module';
import { LocationsModule } from './modules/catalog/locations/locations.module';
import { StockModule } from './modules/inventory/stock/stock.module';
import { MovementsModule } from './modules/inventory/movements/movements.module';
import { InventoryModule } from './modules/inventory/inventory.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig, databaseConfig] }),
    TypeOrmModule.forRootAsync({ useFactory: getDataSourceOptions, inject: [] }),
    UsersModule,
    AuthModule,
    TicketsModule,
    ItemsModule,
    LocationsModule,
    StockModule,
    MovementsModule,
    InventoryModule,
  ],
})
export class AppModule {}
