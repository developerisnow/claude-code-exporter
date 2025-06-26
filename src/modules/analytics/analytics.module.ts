import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SessionsModule } from '../sessions/sessions.module';
import { PromptsModule } from '../prompts/prompts.module';
import { ExportModule } from '../export/export.module';
import { AggregateByProjectUseCase } from './application/aggregate-by-project.use-case';
import { AggregationSchedulerService } from './infrastructure/aggregation-scheduler.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    SessionsModule,
    PromptsModule,
    ExportModule,
  ],
  providers: [AggregateByProjectUseCase, AggregationSchedulerService],
  exports: [AggregateByProjectUseCase, AggregationSchedulerService],
})
export class AnalyticsModule {}
