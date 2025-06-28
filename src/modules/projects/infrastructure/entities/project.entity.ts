import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { SessionEntity } from '../../../sessions/infrastructure/entities/session.entity';
import { AggregateJobEntity } from '../../../aggregation/infrastructure/entities/aggregate-job.entity';
import { ConversationEntity } from '../../../import/cursor/entities/conversation.entity';
import { ProviderEntity } from '../../../providers/entities/provider.entity';

@Entity('projects')
@Index(['path', 'providerId'], { unique: true })
@Index(['encodedPath'], { unique: true })
@Index(['lastUpdated'])
@Index(['providerId'])
export class ProjectEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  path: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'encoded_path', type: 'varchar', length: 500, unique: true })
  encodedPath: string;

  @Column({ name: 'provider_id', type: 'uuid' })
  providerId: string;

  @ManyToOne(() => ProviderEntity, provider => provider.projects)
  @JoinColumn({ name: 'provider_id' })
  provider: ProviderEntity;

  @Column({ name: 'project_type', type: 'varchar', length: 50, default: 'claude_code' })
  projectType: string;

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

  @OneToMany(() => ConversationEntity, (conversation) => conversation.project)
  conversations: ConversationEntity[];

  @OneToMany(() => AggregateJobEntity, (job) => job.project)
  aggregateJobs: AggregateJobEntity[];
}