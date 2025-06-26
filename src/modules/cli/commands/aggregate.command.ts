import { Command, CommandRunner, Option } from 'nest-commander';
import { Logger } from '@nestjs/common';
import { AggregateByProjectUseCase } from '../../analytics/application/aggregate-by-project.use-case';
import { AggregateByProjectCommand } from '../../analytics/application/commands/aggregate-by-project.command';
import { AggregationSchedulerService } from '../../analytics/infrastructure/aggregation-scheduler.service';
import ora from 'ora';

interface AggregateOptions {
  output?: string;
  append?: boolean;
  schedule?: boolean;
  disable?: boolean;
  status?: boolean;
}

@Command({
  name: 'aggregate',
  description: 'Aggregate all prompts by project',
})
export class AggregateCommand extends CommandRunner {
  private readonly logger = new Logger(AggregateCommand.name);

  constructor(
    private readonly aggregateUseCase: AggregateByProjectUseCase,
    private readonly schedulerService: AggregationSchedulerService,
  ) {
    super();
  }

  async run(passedParams: string[], options: AggregateOptions): Promise<void> {
    // Handle scheduler options
    if (options.status) {
      const status = this.schedulerService.getStatus();
      console.log('Aggregation Scheduler Status:');
      console.log(`  Enabled: ${status.enabled}`);
      console.log(`  Output Path: ${status.outputPath}`);
      return;
    }

    if (options.schedule) {
      this.schedulerService.enableScheduler();
      console.log('Aggregation scheduler enabled (runs every 5 minutes)');
      return;
    }

    if (options.disable) {
      this.schedulerService.disableScheduler();
      console.log('Aggregation scheduler disabled');
      return;
    }

    // Run aggregation
    const outputPath = options.output || './aggregated';
    const appendOnly = options.append !== false; // Default true

    const spinner = ora('Aggregating prompts by project...').start();

    try {
      const command = new AggregateByProjectCommand({
        outputPath,
        appendOnly,
      });

      const result = await this.aggregateUseCase.execute(command);

      if (result.hasData()) {
        spinner.succeed(
          `Aggregation completed: ${result.projectsAggregated} projects, ${result.totalPrompts} prompts`,
        );
        console.log(`Output saved to: ${result.outputPath}`);
      } else {
        spinner.info('No prompts found to aggregate');
      }
    } catch (error) {
      spinner.fail('Aggregation failed');
      throw error;
    }
  }

  @Option({
    flags: '-o, --output <path>',
    description: 'Output directory for aggregated files',
  })
  parseOutput(val: string): string {
    return val;
  }

  @Option({
    flags: '--no-append',
    description: 'Replace existing files instead of appending',
  })
  parseNoAppend(): boolean {
    return false;
  }

  @Option({
    flags: '--schedule',
    description: 'Enable automatic aggregation every 5 minutes',
  })
  parseSchedule(): boolean {
    return true;
  }

  @Option({
    flags: '--disable',
    description: 'Disable automatic aggregation',
  })
  parseDisable(): boolean {
    return true;
  }

  @Option({
    flags: '--status',
    description: 'Show scheduler status',
  })
  parseStatus(): boolean {
    return true;
  }
}
