import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { AggregateByProjectUseCase } from '../application/aggregate-by-project.use-case';
import { AggregateByProjectCommand } from '../application/commands/aggregate-by-project.command';

@Injectable()
export class AggregationSchedulerService {
  private readonly logger = new Logger(AggregationSchedulerService.name);
  private isEnabled: boolean;
  private outputPath: string;

  constructor(
    private readonly aggregateByProjectUseCase: AggregateByProjectUseCase,
    private readonly configService: ConfigService,
  ) {
    this.isEnabled = this.configService.get<boolean>('aggregation.enabled', false);
    this.outputPath = this.configService.get<string>('aggregation.outputPath', './aggregated');
    
    if (this.isEnabled) {
      this.logger.log('Aggregation scheduler enabled');
    }
  }

  @Cron('*/5 * * * *') // Every 5 minutes
  async aggregateByProject(): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    this.logger.debug('Starting scheduled aggregation');
    
    try {
      const command = new AggregateByProjectCommand({
        outputPath: this.outputPath,
        appendOnly: true, // Always append in cron jobs
      });
      
      const result = await this.aggregateByProjectUseCase.execute(command);
      
      if (result.hasData()) {
        this.logger.log(
          `Aggregation completed: ${result.projectsAggregated} projects, ${result.totalPrompts} prompts`,
        );
      } else {
        this.logger.debug('No new data to aggregate');
      }
    } catch (error) {
      this.logger.error('Aggregation failed', error.stack);
    }
  }

  enableScheduler(): void {
    this.isEnabled = true;
    this.logger.log('Aggregation scheduler enabled');
  }

  disableScheduler(): void {
    this.isEnabled = false;
    this.logger.log('Aggregation scheduler disabled');
  }

  setOutputPath(path: string): void {
    this.outputPath = path;
    this.logger.log(`Aggregation output path set to: ${path}`);
  }

  getStatus(): { enabled: boolean; outputPath: string } {
    return {
      enabled: this.isEnabled,
      outputPath: this.outputPath,
    };
  }
}