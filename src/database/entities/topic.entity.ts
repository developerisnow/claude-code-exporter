import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { PromptEntity } from './prompt.entity';

@Entity('topics')
@Index(['name', 'project_path'], { unique: true })
export class TopicEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('text')
  name: string;

  @Column('text')
  project_path: string;

  @Column('text', { nullable: true })
  description: string | null;

  @Column('integer', { default: 0 })
  prompt_count: number;

  @Column('timestamp', { nullable: true })
  last_active_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToMany(() => PromptEntity, (prompt) => prompt.topics)
  prompts: PromptEntity[];
}
