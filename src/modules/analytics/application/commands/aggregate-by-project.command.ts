export interface AggregateByProjectCommandParams {
  outputPath: string;
  appendOnly: boolean;
}

export class AggregateByProjectCommand {
  readonly outputPath: string;
  readonly appendOnly: boolean;

  constructor(params: AggregateByProjectCommandParams) {
    this.outputPath = params.outputPath;
    this.appendOnly = params.appendOnly;
  }
}
