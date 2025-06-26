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
import { AggregateResultEntity } from './aggregate-result.entity';

export enum AggregateJobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('aggregate_jobs')
@Index(['projectId'])
@Index(['status'])
@Index(['scheduledAt'])
export class AggregateJobEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId: string;

  @Column({
    type: 'enum',
    enum: AggregateJobStatus,
    default: AggregateJobStatus.PENDING,
  })
  status: AggregateJobStatus;

  @Column({ name: 'scheduled_at', type: 'timestamp' })
  scheduledAt: Date;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'jsonb', default: {} })
  config: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => ProjectEntity, (project) => project.aggregateJobs, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  @OneToMany(() => AggregateResultEntity, (result) => result.job)
  results: AggregateResultEntity[];
}