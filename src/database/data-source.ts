import { DataSource, DataSourceOptions } from 'typeorm';
import databaseConfig from '../config/database.config';
import { SnakeNamingStrategy } from './naming.strategy';
import { User } from '../modules/users/entities/user.entity';
import { Ticket } from 'src/modules/tickets/entities/ticket.entity';
import { Item } from 'src/modules/catalog/items/entities/item.entity';
import { Location } from 'src/modules/catalog/locations/entities/location.entity';
import { InventoryMovement } from 'src/modules/inventory/movements/entities/movement.entity';
import { Inventory } from 'src/modules/inventory/stock/entities/inventory.entity';
import { MaterialRequest } from 'src/modules/material-requests/entities/material-request.entity';
import { MaterialRequestItem } from 'src/modules/material-requests/entities/material-request-item.entity';


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
    entities: [User, Ticket,Item,Location,InventoryMovement,Inventory,MaterialRequest,MaterialRequestItem], // o [__dirname + '/../**/*.entity.{ts,js}']
    migrations: [__dirname + '/migrations/*.{ts,js}'],
    namingStrategy: new SnakeNamingStrategy(),
    synchronize: true,
    logging: false,
  };
};

const dataSource = new DataSource(getDataSourceOptions());
export default dataSource;
