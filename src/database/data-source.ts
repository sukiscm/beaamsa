import { DataSource, DataSourceOptions } from 'typeorm';
import databaseConfig from '../config/database.config';
import { SnakeNamingStrategy } from './naming.strategy';
import { User } from '../modules/users/entities/user.entity';
import { Ticket } from 'src/modules/tickets/entities/ticket.entity';

export const getDataSourceOptions = (): DataSourceOptions => {
  const cfg = databaseConfig().db;
  console.log(cfg)
  return {
    type: 'postgres',
    host: cfg.host,
    port: cfg.port,
    username: cfg.user,
    password: cfg.pass,
    database: cfg.name,
    entities: [User, Ticket], // o [__dirname + '/../**/*.entity.{ts,js}']
    migrations: [__dirname + '/migrations/*.{ts,js}'],
    namingStrategy: new SnakeNamingStrategy(),
    synchronize: true,
    logging: false,
  };
};

const dataSource = new DataSource(getDataSourceOptions());
export default dataSource;
