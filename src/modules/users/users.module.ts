// src/modules/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity'; // 👈 ruta correcta

@Module({
  imports: [TypeOrmModule.forFeature([User])], // 👈 NECESARIO
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // opcional
})
export class UsersModule {}
