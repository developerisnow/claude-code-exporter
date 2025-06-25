import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
  Index,
} from 'typeorm';
import { SessionEntity } from './session.entity';
import { TopicEntity } from './topic.entity';

export enum PromptRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

@Entity('prompts')
@Index('idx_prompts_session_id', ['sessionId'])
@Index('idx_prompts_timestamp', ['timestamp'])
@Index('idx_prompts_role', ['role'])
@Index('idx_prompts_session_timestamp', ['sessionId', 'timestamp'])
export class PromptEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @Column({
    type: 'enum',
    enum: PromptRole,
  })
  role: PromptRole;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'timestamptz' })
  timestamp: Date;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({
    name: 'content_length',
    type: 'int',
    generatedType: 'STORED',
    asExpression: 'LENGTH(content)',
  })
  contentLength: number;

  @Column({
    name: 'word_count',
    type: 'int',
    generatedType: 'STORED',
    asExpression: `array_length(string_to_array(regexp_replace(content, '[^\\w\\s]', '', 'g'), ' '), 1)`,
  })
  wordCount: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => SessionEntity, (session) => session.prompts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_id' })
  session: SessionEntity;

  @ManyToMany(() => TopicEntity, (topic) => topic.prompts)
  @JoinTable({
    name: 'prompt_topics',
    joinColumn: {
      name: 'prompt_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'topic_id',
      referencedColumnName: 'id',
    },
  })
  topics: TopicEntity[];
}