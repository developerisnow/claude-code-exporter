import {
  Entity,
  Column,
  PrimaryColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PromptEntity } from './prompt.entity';

@Entity('sessions')
export class SessionEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('text')
  project_path: string;

  @Column('timestamp')
  start_time: Date;

  @Column('timestamp', { nullable: true })
  end_time: Date | null;

  @Column('integer', { default: 0 })
  prompt_count: number;

  @Column('integer', { default: 0 })
  code_files_count: number;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => PromptEntity, (prompt) => prompt.session)
  prompts: PromptEntity[];
}
