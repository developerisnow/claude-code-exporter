import { Module } from '@nestjs/common';
import { SessionsModule } from '../sessions/sessions.module';
import { PromptsModule } from '../prompts/prompts.module';
import { ExportSessionUseCase } from './application/export-session.use-case';
import { MarkdownExporter } from './infrastructure/markdown-exporter';
import { JsonExporter } from './infrastructure/json-exporter';
import { FileSystemService } from './infrastructure/file-system.service';

@Module({
  imports: [SessionsModule, PromptsModule],
  providers: [
    ExportSessionUseCase,
    MarkdownExporter,
    JsonExporter,
    FileSystemService,
  ],
  exports: [ExportSessionUseCase, FileSystemService],
})
export class ExportModule {}
