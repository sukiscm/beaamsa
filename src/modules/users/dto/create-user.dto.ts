import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

export class CreateUserDto {
  @IsEmail() email: string;
  @IsNotEmpty() @MinLength(8) password: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsEnum(UserRole) role?: UserRole;
  @IsOptional() @IsBoolean() activo?: boolean;
}
