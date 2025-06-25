import { ExportFormat, ExportMode } from '../../domain/export-format.enum';

export interface ExportSessionCommandParams {
  projectPath?: string;
  outputPath: string;
  format: ExportFormat;
  mode: ExportMode;
}

export class ExportSessionCommand {
  readonly projectPath?: string;
  readonly outputPath: string;
  readonly format: ExportFormat;
  readonly mode: ExportMode;

  constructor(params: ExportSessionCommandParams) {
    this.projectPath = params.projectPath;
    this.outputPath = params.outputPath;
    this.format = params.format;
    this.mode = params.mode;
  }
}