import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { ProjectEntity } from '../../../projects/infrastructure/entities/project.entity';
import { MessageEntity } from './message.entity';
import { ExportEntity } from '../../../export/infrastructure/entities/export.entity';

@Entity('sessions')
@Index(['projectId'])
@Index(['sessionId'], { unique: true })
@Index(['startedAt'])
@Index(['importedAt'])
export class SessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @Column({ name: 'session_id', type: 'varchar', length: 100, unique: true })
  sessionId: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  title: string;

  @Column({ name: 'message_count', type: 'int', default: 0 })
  messageCount: number;

  @Column({ name: 'user_message_count', type: 'int', default: 0 })
  userMessageCount: number;

  @Column({ name: 'assistant_message_count', type: 'int', default: 0 })
  assistantMessageCount: number;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ name: 'ended_at', type: 'timestamp', nullable: true })
  endedAt: Date;

  @Column({ name: 'imported_at', type: 'timestamp' })
  importedAt: Date;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => ProjectEntity, (project) => project.sessions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  @OneToMany(() => MessageEntity, (message) => message.session)
  messages: MessageEntity[];

  @OneToMany(() => ExportEntity, (export_) => export_.session)
  exports: ExportEntity[];
}