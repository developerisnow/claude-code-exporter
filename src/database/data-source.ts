import { DataSource } from 'typeorm';
import { SessionEntity } from './entities/session.entity';
import { PromptEntity } from './entities/prompt.entity';
import { TopicEntity } from './entities/topic.entity';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME || 'claude_exporter',
  password: process.env.DATABASE_PASSWORD || 'password',
  database: process.env.DATABASE_NAME || 'claude_exporter',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.DATABASE_LOGGING === 'true',
  entities: [SessionEntity, PromptEntity, TopicEntity],
  migrations: ['src/database/migrations/*.ts'],
  subscribers: [],
});
