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
    tipo: MovementType;
    cantidad: number;
    userId: string;
    ref?: { tipo?: string; id?: string };
    comentario?: string;
  }) {
    if (params.cantidad <= 0) {
      throw new BadRequestException('Cantidad debe ser > 0');
    }

    return this.dataSource.transaction(async (manager) => {
      const invRepo = manager.getRepository(Inventory);
      const movRepo = manager.getRepository(InventoryMovement);

      // 1) Buscar inventario con lock (SIN eager loading para evitar problemas)
      let inv = await invRepo
        .createQueryBuilder('inv')
        .where('inv.item_id = :itemId', { itemId: params.itemId })
        .andWhere('inv.location_id = :locationId', { locationId: params.locationId })
        .setLock('pessimistic_write')
        .getOne();

      // 2) Si no existe, crear registro nuevo
      if (!inv) {
        console.log(`📦 Creando nuevo registro de inventario para item ${params.itemId}`);
        inv = invRepo.create({
          item: { id: params.itemId } as any,
          location: { id: params.locationId } as any,
          cantidad: '0',
        });
        inv = await invRepo.save(inv);
      }

      // 3) Convertir cantidad actual a número con validación
      const currentStock = parseFloat(inv.cantidad || '0');
      
      if (isNaN(currentStock)) {
        throw new BadRequestException(`Stock actual inválido: ${inv.cantidad}`);
      }

      console.log(`📊 Stock actual: ${currentStock} | Operación: ${params.tipo} | Cantidad: ${params.cantidad}`);

      // 4) Calcular nuevo saldo
      let newStock = currentStock;

      switch (params.tipo) {
        case MovementType.IN:
          newStock = currentStock + params.cantidad;
          console.log(`➕ Entrada: ${currentStock} + ${params.cantidad} = ${newStock}`);
          break;

        case MovementType.OUT:
          newStock = currentStock - params.cantidad;
          console.log(`➖ Salida: ${currentStock} - ${params.cantidad} = ${newStock}`);
          
          // 🔥 VALIDACIÓN CRÍTICA: Verificar stock suficiente
          if (newStock < 0) {
            throw new BadRequestException(
              `Stock insuficiente. Disponible: ${currentStock}, Solicitado: ${params.cantidad}, Faltante: ${Math.abs(newStock)}`
            );
          }
          break;

        case MovementType.ADJUST:
          newStock = params.cantidad;
          console.log(`🔧 Ajuste: ${currentStock} → ${newStock}`);
          break;
      }

      // 5) Actualizar inventario
      inv.cantidad = newStock.toFixed(2); // Mantener 2 decimales
      await invRepo.save(inv);

      console.log(`✅ Nuevo stock guardado: ${inv.cantidad}`);

      // 6) Registrar movimiento (kardex)
      const movementQty = params.tipo === MovementType.ADJUST 
        ? Math.abs(newStock - currentStock)
        : params.cantidad;

      const mov = movRepo.create({
        item: { id: params.itemId } as any,
        location: { id: params.locationId } as any,
        tipo: params.tipo,
        cantidad: movementQty.toFixed(2),
        saldo_despues: newStock.toFixed(2),
        ref_tipo: params.ref?.tipo,
        ref_id: params.ref?.id,
        comentario: params.comentario,
        user: { id: params.userId } as any,
      });

      const savedMovement = await movRepo.save(mov);
      
      console.log(`📝 Movimiento registrado: ${savedMovement.id}`);

      return savedMovement;
    });
  }

  // Helpers de lectura
  findStock(itemId?: string, locationId?: string) {
    const query = this.invRepo.createQueryBuilder('inv');

    if (itemId) {
      query.andWhere('inv.item_id = :itemId', { itemId });
    }

    if (locationId) {
      query.andWhere('inv.location_id = :locationId', { locationId });
    }

    return query
      .leftJoinAndSelect('inv.item', 'item')
      .andWhere('item.activo = :activo', { activo: true })
      .leftJoinAndSelect('inv.location', 'location')
      .orderBy('inv.updated_at', 'DESC')
      .getMany();
  }

  findMovements(itemId: string) {
    return this.movRepo
      .createQueryBuilder('mov')
      .where('mov.item_id = :itemId', { itemId })
      .leftJoinAndSelect('mov.item', 'item')
      .leftJoinAndSelect('mov.location', 'location')
      .leftJoinAndSelect('mov.user', 'user')
      .orderBy('mov.created_at', 'DESC')
      .take(100)
      .getMany();
  }

  // 🆕 NUEVO: Método para verificar stock disponible
  async checkStock(itemId: string, locationId: string): Promise<number> {
    // 🔥 USAR QUERY BUILDER para asegurar que la query sea correcta
    const inv = await this.invRepo
      .createQueryBuilder('inv')
      .where('inv.item_id = :itemId', { itemId })
      .andWhere('inv.location_id = :locationId', { locationId })
      .getOne();

    const stock = inv ? parseFloat(inv.cantidad || '0') : 0;
    
    console.log(`🔍 checkStock: itemId=${itemId}, locationId=${locationId}, stock=${stock}`);
    
    return stock;
  }

  async transfer(params: {
    itemId: string;
    fromLocationId: string;
    toLocationId: string;
    cantidad: number;
    userId: string;
    comentario?: string;
  }) {
    console.log('🔄 Iniciando transferencia:', params);

    // Validaciones previas
    if (params.cantidad <= 0) {
      throw new BadRequestException('Cantidad debe ser > 0');
    }

    if (params.fromLocationId === params.toLocationId) {
      throw new BadRequestException('Las ubicaciones de origen y destino deben ser diferentes');
    }

    return this.dataSource.transaction(async (manager) => {
      const invRepo = manager.getRepository(Inventory);
      const movRepo = manager.getRepository(InventoryMovement);

      // 1) Verificar stock disponible en ubicación origen
      let invFrom = await invRepo
        .createQueryBuilder('inv')
        .where('inv.item_id = :itemId', { itemId: params.itemId })
        .andWhere('inv.location_id = :locationId', { locationId: params.fromLocationId })
        .setLock('pessimistic_write')
        .getOne();

      if (!invFrom) {
        throw new BadRequestException('No hay stock registrado en la ubicación de origen');
      }

      const stockFrom = parseFloat(invFrom.cantidad || '0');

      if (stockFrom < params.cantidad) {
        throw new BadRequestException(
          `Stock insuficiente en origen. Disponible: ${stockFrom}, Solicitado: ${params.cantidad}`
        );
      }

      // 2) Buscar o crear inventario en ubicación destino
      let invTo = await invRepo
        .createQueryBuilder('inv')
        .where('inv.item_id = :itemId', { itemId: params.itemId })
        .andWhere('inv.location_id = :locationId', { locationId: params.toLocationId })
        .setLock('pessimistic_write')
        .getOne();

      if (!invTo) {
        console.log('📦 Creando registro de inventario en ubicación destino');
        invTo = invRepo.create({
          item: { id: params.itemId } as any,
          location: { id: params.toLocationId } as any,
          cantidad: '0',
        });
        invTo = await invRepo.save(invTo);
      }

      const stockTo = parseFloat(invTo.cantidad || '0');

      // 3) Actualizar inventarios
      const newStockFrom = stockFrom - params.cantidad;
      const newStockTo = stockTo + params.cantidad;

      invFrom.cantidad = newStockFrom.toFixed(2);
      invTo.cantidad = newStockTo.toFixed(2);

      await invRepo.save(invFrom);
      await invRepo.save(invTo);

      console.log(`✅ Transferencia completada: ${stockFrom} → ${newStockFrom} (origen) | ${stockTo} → ${newStockTo} (destino)`);

      // 4) Registrar movimiento OUT (origen)
      const movOut = movRepo.create({
        item: { id: params.itemId } as any,
        location: { id: params.fromLocationId } as any,
        tipo: MovementType.OUT,
        cantidad: params.cantidad.toFixed(2),
        saldo_despues: newStockFrom.toFixed(2),
        ref_tipo: 'TRANSFER',
        comentario: params.comentario || `Transferencia a ubicación destino`,
        user: { id: params.userId } as any,
      });

      await movRepo.save(movOut);

      // 5) Registrar movimiento IN (destino)
      const movIn = movRepo.create({
        item: { id: params.itemId } as any,
        location: { id: params.toLocationId } as any,
        tipo: MovementType.IN,
        cantidad: params.cantidad.toFixed(2),
        saldo_despues: newStockTo.toFixed(2),
        ref_tipo: 'TRANSFER',
        comentario: params.comentario || `Transferencia desde ubicación origen`,
        user: { id: params.userId } as any,
      });

      await movRepo.save(movIn);

      console.log('📝 Movimientos registrados en kardex');

      return {
        success: true,
        from: {
          locationId: params.fromLocationId,
          previousStock: stockFrom,
          newStock: newStockFrom,
        },
        to: {
          locationId: params.toLocationId,
          previousStock: stockTo,
          newStock: newStockTo,
        },
        movements: {
          out: movOut,
          in: movIn,
        },
      };
    });
  }

}

