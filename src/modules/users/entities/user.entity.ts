import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole } from '../enums/user-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Index({ unique: true })
  @Column() email: string;

  @Exclude()
  @Column() password: string;

  @Column({ nullable: true }) name?: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.TECNICO })
  role: UserRole;

  @Column({ default: true }) activo: boolean;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
