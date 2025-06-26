import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { SessionEntity } from '../../../sessions/infrastructure/entities/session.entity';
import { AggregateJobEntity } from '../../../aggregation/infrastructure/entities/aggregate-job.entity';

@Entity('projects')
@Index(['path'], { unique: true })
@Index(['encodedPath'], { unique: true })
@Index(['lastUpdated'])
export class ProjectEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500, unique: true })
  path: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'encoded_path', type: 'varchar', length: 500, unique: true })
  encodedPath: string;

  @Column({ name: 'first_seen', type: 'timestamp' })
  firstSeen: Date;

  @Column({ name: 'last_updated', type: 'timestamp' })
  lastUpdated: Date;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => SessionEntity, (session) => session.project)
  sessions: SessionEntity[];

  @OneToMany(() => AggregateJobEntity, (job) => job.project)
  aggregateJobs: AggregateJobEntity[];
}