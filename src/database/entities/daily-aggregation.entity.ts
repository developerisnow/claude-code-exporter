import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
  Index,
} from 'typeorm';

@Entity('daily_aggregations')
@Index('idx_daily_aggregations_date', ['date'])
export class DailyAggregationEntity {
  @PrimaryColumn({ type: 'date' })
  date: string;

  @Column({ name: 'session_count', type: 'int', default: 0 })
  sessionCount: number;

  @Column({ name: 'prompt_count', type: 'int', default: 0 })
  promptCount: number;

  @Column({ name: 'user_prompt_count', type: 'int', default: 0 })
  userPromptCount: number;

  @Column({ name: 'assistant_prompt_count', type: 'int', default: 0 })
  assistantPromptCount: number;

  @Column({ name: 'avg_prompt_length', type: 'float', default: 0 })
  avgPromptLength: number;

  @Column({ name: 'avg_word_count', type: 'float', default: 0 })
  avgWordCount: number;

  @Column({ name: 'topic_distribution', type: 'jsonb', default: {} })
  topicDistribution: Record<string, number>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}