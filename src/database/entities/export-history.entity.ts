import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum ExportFormat {
  MARKDOWN = 'markdown',
  JSON = 'json',
  CSV = 'csv',
}

export enum ExportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('export_history')
@Index('idx_export_history_status', ['status'])
@Index('idx_export_history_created_at', ['startedAt'])
export class ExportHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ExportFormat,
  })
  format: ExportFormat;

  @Column({ type: 'jsonb', default: {} })
  filters: Record<string, any>;

  @Column({ name: 'file_path', type: 'varchar', length: 500, nullable: true })
  filePath: string | null;

  @Column({ name: 'file_size', type: 'bigint', nullable: true })
  fileSize: number | null;

  @Column({ name: 'record_count', type: 'int', nullable: true })
  recordCount: number | null;

  @Column({
    type: 'enum',
    enum: ExportStatus,
    default: ExportStatus.PENDING,
  })
  status: ExportStatus;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'started_at', type: 'timestamptz' })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'created_by', type: 'varchar', length: 255, nullable: true })
  createdBy: string | null;
}