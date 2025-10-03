import { Module } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [LocationsController],
  providers: [LocationsService],
  exports: [TypeOrmModule],
})
export class LocationsModule {}
