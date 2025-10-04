// src/database/seeds/seed.ts
import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Verificar que se cargaron las variables
console.log('📋 Variables de entorno cargadas:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASS:', process.env.DB_PASS ? '***' : '❌ NO DEFINIDO');
console.log('DB_NAME:', process.env.DB_NAME);

import dataSource from '../data-source';
import { seedItems } from './items.seed';

async function runSeeds() {
  try {
    console.log('\n🌱 Iniciando seeds...');
    
    // Inicializar conexión
    await dataSource.initialize();
    console.log('✅ Conexión a base de datos establecida');

    // Ejecutar seeds
    await seedItems(dataSource);

    console.log('🎉 Seeds completados exitosamente');
    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error ejecutando seeds:', error);
    await dataSource.destroy().catch(() => {});
    process.exit(1);
  }
}

runSeeds();