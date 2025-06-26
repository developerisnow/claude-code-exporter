import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { registerAs } from '@nestjs/config';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'claude_exporter',
    password: process.env.DATABASE_PASSWORD || 'password',
    database: process.env.DATABASE_NAME || 'claude_exporter',
    autoLoadEntities: true,
    synchronize: process.env.NODE_ENV === 'development',
    logging: process.env.DATABASE_LOGGING === 'true',
    entities: ['dist/**/*.entity{.ts,.js}'],
    migrations: ['dist/database/migrations/*{.ts,.js}'],
    migrationsTableName: 'migrations',
  }),
);
