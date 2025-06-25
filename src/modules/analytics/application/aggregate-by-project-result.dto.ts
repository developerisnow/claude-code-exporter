export interface AggregateByProjectResultData {
  projectsAggregated: number;
  totalPrompts: number;
  outputPath: string;
}

export class AggregateByProjectResult {
  readonly projectsAggregated: number;
  readonly totalPrompts: number;
  readonly outputPath: string;

  constructor(data: AggregateByProjectResultData) {
    this.projectsAggregated = data.projectsAggregated;
    this.totalPrompts = data.totalPrompts;
    this.outputPath = data.outputPath;
  }

  hasData(): boolean {
    return this.projectsAggregated > 0 && this.totalPrompts > 0;
  }
}