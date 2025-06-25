import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  Index,
  Unique,
} from 'typeorm';
import { PromptEntity } from './prompt.entity';

interface TopicRules {
  keywords: string[];
  patterns: string[];
  excludeKeywords: string[];
}

@Entity('topics')
@Unique(['name'])
@Index('idx_topics_name', ['name'])
@Index('idx_topics_created_at', ['createdAt'])
export class TopicEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'jsonb',
    default: { keywords: [], patterns: [], excludeKeywords: [] },
  })
  rules: TopicRules;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'created_by', type: 'varchar', length: 255, nullable: true })
  createdBy: string | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToMany(() => PromptEntity, (prompt) => prompt.topics)
  prompts: PromptEntity[];
}