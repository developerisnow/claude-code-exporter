import {
  Entity,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  Index,
} from 'typeorm';
import { PromptEntity } from './prompt.entity';
import { TopicEntity } from './topic.entity';

@Entity('prompt_topics')
@Index('idx_prompt_topics_topic_id', ['topicId'])
@Index('idx_prompt_topics_confidence', ['confidence'])
export class PromptTopicEntity {
  @PrimaryColumn({ name: 'prompt_id', type: 'uuid' })
  promptId: string;

  @PrimaryColumn({ name: 'topic_id', type: 'uuid' })
  topicId: string;

  @Column({ type: 'float' })
  confidence: number;

  @CreateDateColumn({ name: 'assigned_at', type: 'timestamptz' })
  assignedAt: Date;

  @Column({
    name: 'assigned_by',
    type: 'varchar',
    length: 50,
    default: 'system',
  })
  assignedBy: string;

  @ManyToOne(() => PromptEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prompt_id' })
  prompt: PromptEntity;

  @ManyToOne(() => TopicEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'topic_id' })
  topic: TopicEntity;
}