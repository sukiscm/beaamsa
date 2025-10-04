// src/database/seeds/items.seed.ts
import { Item } from 'src/modules/catalog/items/entities/item.entity';
import { DataSource } from 'typeorm';

export async function seedItems(dataSource: DataSource) {
  const itemRepo = dataSource.getRepository(Item);

  const items = [
    { descripcion: '6010 FR7A CAPUCHA DE ALGODÓN', serie: 'S/N', categoria: 'EPP', proceso: 'OPERACIONES', status: 'EN OPERACIÓN', inventario: 1 },
    { descripcion: 'ABRAZADERA PLÁSTICO RÁPIDA MACHO/HEMBRA TRUPER 1/2"', serie: 'S/N', categoria: 'MATERIAL', proceso: 'OPERACIONES', status: 'EN OPERACIÓN', inventario: 10 },
    { descripcion: 'ABRAZADERA PLÁSTICO RÁPIDA MACHO/HEMBRA TRUPER 3/4" - 5/8"', serie: 'S/N', categoria: 'MATERIAL', proceso: 'OPERACIONES', status: 'EN OPERACIÓN', inventario: 2 },
    { descripcion: 'ACIDO CÍTRICO CLR DESCALSIFICANTE INDUSTRIAL (828 ML)', serie: 'S/N', categoria: 'ALIMENTICIA', proceso: 'OPERACIONES', status: 'EN OPERACIÓN', inventario: 1 },
    { descripcion: 'ADAPTADOR P/MANIFOLD', serie: 'S/N', categoria: 'HERRAMIENTA', proceso: 'OPERACIONES', status: 'EN OPERACIÓN', inventario: 5 },
    { descripcion: 'ADAPTADOR P/PUNTAS', serie: 'S/N', categoria: 'HERRAMIENTA', proceso: 'OPERACIONES', status: 'EN OPERACIÓN', inventario: 1 },
    { descripcion: 'ANALIZADOR DE GASES BACHARACH 0024-8512', serie: 'S/N', categoria: 'EQUIPO', proceso: 'OPERACIONES', status: 'EN OPERACIÓN', inventario: 1 },
    { descripcion: 'ANALIZADOR PH/TDS/SAL/TEMP AGUA', serie: 'S/N', categoria: 'EQUIPO', proceso: 'OPERACIONES', status: 'EN OPERACIÓN', inventario: 1 },
    { descripcion: 'ANEMOMETRO DIGITAL BENETECH', serie: 'S/N', categoria: 'EQUIPO', proceso: 'OPERACIONES', status: 'EN OPERACIÓN', inventario: 1 },
    { descripcion: 'ARCO PARA SEGUETA PRETUL CON SEGUETA', serie: 'S/N', categoria: 'HERRAMIENTA', proceso: 'OPERACIONES', status: 'EN OPERACIÓN', inventario: 1 },
    { descripcion: 'ARNES CON LINEA DE VIDA Y AMORT AMARILLO', serie: 'S/N', categoria: 'EPP', proceso: 'OPERACIONES', status: 'EN OPERACIÓN', inventario: 8 },
    { descripcion: 'ARNES CON LINEA DE VIDA Y AMORT ROJO', serie: 'S/N', categoria: 'EPP', proceso: 'OPERACIONES', status: 'EN OPERACIÓN', inventario: 2 },
    { descripcion: 'ARNES TIPO CINTURON CON 2 ARGOLLAS', serie: 'S/N', categoria: 'EPP', proceso: 'OPERACIONES', status: 'EN OPERACIÓN', inventario: 2 },
    { descripcion: 'ASPIRADORA P/CARR KOBLENZ', serie: 'S/N', categoria: 'EQUIPO', proceso: 'OPERACIONES', status: 'EN OPERACIÓN', inventario: 1 },
    { descripcion: 'ASPIRADORA STANLEY', serie: 'S/N', categoria: 'EQUIPO', proceso: 'OPERACIONES', status: 'EN OPERACIÓN', inventario: 1 },
    { descripcion: 'AUTOCLE SURE BILT 43 PZAS', serie: 'S/N', categoria: 'HERRAMIENTA', proceso: 'OPERACIONES', status: 'EN OPERACIÓN', inventario: 1 },
    { descripcion: 'AVELLANADOR 4 MEDIDAS', serie: 'S/N', categoria: 'HERRAMIENTA', proceso: 'OPERACIONES', status: 'EN OPERACIÓN', inventario: 1 },
    { descripcion: 'AVELLANADOR 5/8" 3/4" 7/8" 1 1/8" GB', serie: 'S/N', categoria: 'HERRAMIENTA', proceso: 'OPERACIONES', status: 'EN OPERACIÓN', inventario: 1 },
    { descripcion: 'AVELLANADOR 7 MEDIDAS', serie: 'S/N', categoria: 'HERRAMIENTA', proceso: 'OPERACIONES', status: 'EN OPERACIÓN', inventario: 1 },
    { descripcion: 'AVELLANADOR 7 MEDIDAS TRUPER', serie: 'S/N', categoria: 'HERRAMIENTA', proceso: 'OPERACIONES', status: 'EN OPERACIÓN', inventario: 2 },
    { descripcion: 'BANDA DE SUJECIÓN SIN MATRACA AMARILLO', serie: 'S/N', categoria: 'HERRAMIENTA', proceso: 'OPERACIONES', status: 'EN OPERACIÓN', inventario: 3 },
    { descripcion: 'BANDA DE SUJECIÓN SIN MATRACA NARANJA', serie: 'S/N', categoria: 'HERRAMIENTA', proceso: 'OPERACIONES', status: 'EN OPERACIÓN', inventario: 2 },
    { descripcion: 'BANDERIN DE SEGURIDAD CON REFLEJANTE', serie: 'S/N', categoria: 'EQUIPOS DE SEGURIDAD', proceso: 'OPERACIONES', status: 'EN OPERACIÓN', inventario: 3 },
    { descripcion: 'BARILLA SOLDADURA DE ALUMINIO', serie: 'S/N', categoria: 'MATERIAL', proceso: 'OPERACIONES', status: 'EN OPERACIÓN', inventario: 0 },
    { descripcion: 'BARILLA SOLDADURA DE PLATA', serie: 'S/N', categoria: 'MATERIAL', proceso: 'OPERACIONES', status: 'EN OPERACIÓN', inventario: 0 },
    { descripcion: 'BASCULA DIGITAL CARGA Y RECUP REF ELITECH', serie: 'S/N', categoria: 'EQUIPO', proceso: 'OPERACIONES', status: 'EN OPERACIÓN', inventario: 1 },
    { descripcion: 'BATERIA DEWALT LITHIUM ION N576585', serie: 'S/N', categoria: 'EQUIPO', proceso: 'OPERACIONES', status: 'EN OPERACIÓN', inventario: 1 },
    { descripcion: 'BATERIA DEWALT LITHIUM ION N830732', serie: 'S/N', categoria: 'EQUIPO', proceso: 'OPERACIONES', status: 'EN OPERACIÓN', inventario: 1 },
    { descripcion: 'BATERIA PRETUL 20V', serie: 'S/N', categoria: 'EQUIPO', proceso: 'OPERACIONES', status: 'EN OPERACIÓN', inventario: 0 },
    { descripcion: 'BATERIA RYOBI 1.3 AMP', serie: 'S/N', categoria: 'EQUIPO', proceso: 'OPERACIONES', status: 'EN OPERACIÓN', inventario: 1 },
    // Agrega el resto de los items aquí... (continúa el patrón)
  ];

  // Verificar si ya existen items
  const count = await itemRepo.count();
  if (count > 0) {
    console.log('⚠️  Items ya existen en la base de datos. Skipping seed...');
    return;
  }

  // Insertar items
  await itemRepo.save(items);
  console.log(`✅ ${items.length} items insertados correctamente`);
}