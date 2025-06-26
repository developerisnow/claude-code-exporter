import { ExportFormat } from '../domain/export-format.enum';

export interface ExportResultData {
  filesCreated: number;
  format: ExportFormat;
  errors: string[];
}

export class ExportResult {
  readonly filesCreated: number;
  readonly format: ExportFormat;
  readonly errors: string[];

  constructor(data: ExportResultData) {
    this.filesCreated = data.filesCreated;
    this.format = data.format;
    this.errors = data.errors;
  }

  isSuccess(): boolean {
    return this.errors.length === 0 && this.filesCreated > 0;
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }
}
