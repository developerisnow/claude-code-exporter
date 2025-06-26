import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { SessionEntity } from '../../../sessions/infrastructure/entities/session.entity';

export enum ExportMode {
  PROMPTS = 'prompts',
  OUTPUTS = 'outputs',
  FULL = 'full',
}

export enum ExportFormat {
  MARKDOWN = 'markdown',
  JSON = 'json',
  TXT = 'txt',
}

@Entity('exports')
@Index(['sessionId'])
@Index(['exportedAt'])
@Index(['exportMode', 'exportFormat'])
export class ExportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id', type: 'uuid', nullable: true })
  sessionId: string;

  @Column({
    name: 'export_mode',
    type: 'enum',
    enum: ExportMode,
  })
  exportMode: ExportMode;

  @Column({
    name: 'export_format',
    type: 'enum',
    enum: ExportFormat,
  })
  exportFormat: ExportFormat;

  @Column({ name: 'file_path', type: 'varchar', length: 500, nullable: true })
  filePath: string;

  @Column({ name: 'message_count', type: 'int', default: 0 })
  messageCount: number;

  @Column({ name: 'exported_at', type: 'timestamp' })
  exportedAt: Date;

  @Column({ type: 'jsonb', default: {} })
  options: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => SessionEntity, (session) => session.exports, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'session_id' })
  session: SessionEntity;
}