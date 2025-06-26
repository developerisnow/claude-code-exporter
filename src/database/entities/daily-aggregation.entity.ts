import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('daily_aggregations')
@Index(['project_path', 'date'], { unique: true })
export class DailyAggregationEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('text')
  project_path: string;

  @Column('date')
  date: Date;

  @Column('integer', { default: 0 })
  prompt_count: number;

  @Column('integer', { default: 0 })
  session_count: number;

  @Column('integer', { default: 0 })
  topic_count: number;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
