import { Module } from '@nestjs/common';
import { ImportModule } from '../import/import.module';
import { ExportModule } from '../export/export.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ExportCommand } from './commands/export.command';
import { ImportCommand } from './commands/import.command';
import { AggregateCommand } from './commands/aggregate.command';

@Module({
  imports: [ImportModule, ExportModule, AnalyticsModule],
  providers: [ExportCommand, ImportCommand, AggregateCommand],
})
export class CliModule {}
