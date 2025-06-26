import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { SessionsModule } from './modules/sessions/sessions.module';
import { PromptsModule } from './modules/prompts/prompts.module';
import { TopicsModule } from './modules/topics/topics.module';
import { ImportModule } from './modules/import/import.module';
import { ExportModule } from './modules/export/export.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { CliModule } from './modules/cli/cli.module';
import databaseConfig from './config/database.config';
import appConfig from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: databaseConfig,
    }),
    ScheduleModule.forRoot(),
    SessionsModule,
    PromptsModule,
    TopicsModule,
    ImportModule,
    ExportModule,
    AnalyticsModule,
    CliModule,
  ],
})
export class AppModule {}
