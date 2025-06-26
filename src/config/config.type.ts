import { AppConfig } from './app-config.type';

export type DatabaseConfig = {
  type: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  synchronize: boolean;
  logging: boolean;
};

export type AllConfigType = {
  app: AppConfig;
  database: DatabaseConfig;
};
