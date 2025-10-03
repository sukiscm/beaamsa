// src/modules/inventory/stock/stock.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { InventoryMovement, MovementType } from '../movements/entities/movement.entity';
import { Inventory } from './entities/inventory.entity';

@Injectable()
export class StockService {
  constructor(
  @InjectRepository(Inventory) private invRepo: Repository<Inventory>,
  @InjectRepository(InventoryMovement) private movRepo: Repository<InventoryMovement>,
  private dataSource: DataSource,
) {}

  async move(params: {
    itemId: string;
    locationId: string;
    tipo: MovementType;       // IN | OUT | ADJUST
    cantidad: number;         // > 0
    userId: string;
    ref?: { tipo?: string; id?: string };
    comentario?: string;
  }) {
    if (params.cantidad <= 0) throw new BadRequestException('Cantidad debe ser > 0');

    return this.dataSource.transaction(async (manager) => {
      const invRepo = manager.getRepository(Inventory);
      const movRepo = manager.getRepository(InventoryMovement);

      // 1) fila de inventario (con lock)
      let inv = await invRepo.findOne({
        where: { item: { id: params.itemId }, location: { id: params.locationId } },
        lock: { mode: 'pessimistic_write' },
      });
      if (!inv) {
        inv = invRepo.create({
          item: { id: params.itemId } as any,
          location: { id: params.locationId } as any,
          cantidad: '0',
        });
      }

      // 2) calcular nuevo saldo
      const current = Number(inv.cantidad);
      let next = current;

      switch (params.tipo) {
        case MovementType.IN:
          next = current + params.cantidad;
          break;
        case MovementType.OUT:
          next = current - params.cantidad;
          if (next < 0) throw new BadRequestException('Stock insuficiente');
          break;
        case MovementType.ADJUST:
          next = params.cantidad; // set a valor exacto
          break;
      }

      // 3) guardar inventario
      inv.cantidad = next.toString();
      await invRepo.save(inv);

      // 4) registrar movimiento
    // 4) registrar movimiento (kardex)
const qty =
  params.tipo === MovementType.ADJUST
    ? Math.abs(next - current)
    : params.cantidad;

const mov = movRepo.create({
  item: { id: params.itemId } as any,
  location: { id: params.locationId } as any,
  tipo: params.tipo,
  cantidad: qty.toString(),          // 👈 string
  saldo_despues: next.toString(),    // 👈 string
  ref_tipo: params.ref?.tipo,
  ref_id: params.ref?.id,
  comentario: params.comentario,
  user: { id: params.userId } as any,
});

return movRepo.save(mov);
    });
  }

  // helpers de lectura
  findStock(itemId?: string, locationId?: string) {
    return this.invRepo.find({
      where: {
        ...(itemId ? { item: { id: itemId } } : {}),
        ...(locationId ? { location: { id: locationId } } : {}),
      },
      order: { updatedAt: 'DESC' },
    });
  }

  findMovements(itemId: string) {
    return this.movRepo.find({
      where: { item: { id: itemId } },
      order: { createdAt: 'DESC' },
    });
  }
}
