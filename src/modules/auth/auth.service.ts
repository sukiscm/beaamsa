// src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
    private cfg: ConfigService,
  ) {}

  async validate(email: string, pass: string) {
    const user = await this.users.findByEmail(email);
    if (!user || !(await bcrypt.compare(pass, user.password))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return user;
  }

  async login(email: string, pass: string) {
    const user = await this.validate(email, pass);
    const payload = { sub: user.id, email: user.email };

    const access_token = await this.jwt.signAsync(payload); // usa secret/ttl del registerAsync
    const refresh_token = await this.jwt.signAsync(
      { sub: user.id },
      {
        secret: this.cfg.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.cfg.get<string>('JWT_REFRESH_TTL', '7d'),
      },
    );

    return { access_token, refresh_token };
  }

  async refresh(userId: string) {
    const access_token = await this.jwt.signAsync({ sub: userId });
    return { access_token };
  }
}
