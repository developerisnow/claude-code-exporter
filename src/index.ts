// Library exports for backward compatibility
export { ClaudePromptExporter } from './lib/claude-prompt-exporter';
export {
  ExportFormat,
  ExportMode,
} from './modules/export/domain/export-format.enum';

// New exports for v2
export * from './modules/sessions/domain/session.entity';
export * from './modules/prompts/domain/prompt.entity';
export * from './modules/topics/domain/topic.entity';
export * from './modules/common/domain/value-objects';
export * from './modules/import/application/import-session.use-case';
export * from './modules/export/application/export-session.use-case';
export * from './modules/analytics/application/aggregate-by-project.use-case';
