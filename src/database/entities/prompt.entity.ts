import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { SessionEntity } from './session.entity';
import { TopicEntity } from './topic.entity';

export enum PromptRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

@Entity('prompts')
export class PromptEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  session_id: string;

  @Column('text')
  role: string;

  @Column('text')
  content: string;

  @Column('timestamp')
  timestamp: Date;

  @Column('integer')
  sequence_number: number;

  @Column('integer', { default: 0 })
  file_count: number;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => SessionEntity, (session) => session.prompts)
  @JoinColumn({ name: 'session_id' })
  session: SessionEntity;

  @ManyToMany(() => TopicEntity, (topic) => topic.prompts)
  @JoinTable({
    name: 'prompt_topics',
    joinColumn: { name: 'prompt_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'topic_id', referencedColumnName: 'id' },
  })
  topics: TopicEntity[];
}
