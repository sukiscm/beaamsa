import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './enums/user-role.enum';

@Controller('/users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @UseGuards(AuthGuard('jwt-access'), RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @Post() create(@Body() dto: CreateUserDto) { return this.users.create(dto); }

  @UseGuards(AuthGuard('jwt-access'), RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @Get() findAll() { return this.users.findAll(); }

  // me/profile debe estar ANTES de :id para que NestJS no lo interprete como un ID
  @UseGuards(AuthGuard('jwt-access'))
  @Get('me/profile') me(@Req() req: any) { return req.user; }

  @UseGuards(AuthGuard('jwt-access'))
  @Get(':id') findOne(@Param('id') id: string) { return this.users.findOne(id); }

  @UseGuards(AuthGuard('jwt-access'), RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateUserDto) { return this.users.update(id, dto); }

  @UseGuards(AuthGuard('jwt-access'), RolesGuard)
  @Roles(UserRole.ADMINISTRADOR)
  @Delete(':id') remove(@Param('id') id: string) { return this.users.remove(id); }
}
