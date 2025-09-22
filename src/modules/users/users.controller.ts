import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('/users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post() create(@Body() dto: CreateUserDto) { return this.users.create(dto); }

  @UseGuards(AuthGuard('jwt-access'))
  @Get() findAll() { return this.users.findAll(); }

  @UseGuards(AuthGuard('jwt-access'))
  @Get(':id') findOne(@Param('id') id: string) { return this.users.findOne(id); }

  @UseGuards(AuthGuard('jwt-access'))
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateUserDto) { return this.users.update(id, dto); }

  @UseGuards(AuthGuard('jwt-access'))
  @Delete(':id') remove(@Param('id') id: string) { return this.users.remove(id); }

  @UseGuards(AuthGuard('jwt-access'))
  @Get('me/profile') me(@Req() req: any) { return req.user; }
}
