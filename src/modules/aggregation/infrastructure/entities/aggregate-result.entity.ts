import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AggregateJobEntity } from './aggregate-job.entity';
import { ProjectEntity } from '../../../projects/infrastructure/entities/project.entity';

export enum AggregateFormat {
  MARKDOWN = 'markdown',
  JSON = 'json',
  TXT = 'txt',
}

@Entity('aggregate_results')
@Index(['jobId'])
@Index(['projectId'])
export class AggregateResultEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'job_id', type: 'uuid' })
  jobId: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @Column({ name: 'file_path', type: 'varchar', length: 500 })
  filePath: string;

  @Column({
    type: 'enum',
    enum: AggregateFormat,
  })
  format: AggregateFormat;

  @Column({ name: 'prompt_count', type: 'int', default: 0 })
  promptCount: number;

  @Column({ name: 'session_count', type: 'int', default: 0 })
  sessionCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => AggregateJobEntity, (job) => job.results, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'job_id' })
  job: AggregateJobEntity;

  @ManyToOne(() => ProjectEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;
}