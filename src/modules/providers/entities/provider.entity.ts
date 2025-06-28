import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ProjectEntity } from '../../projects/infrastructure/entities/project.entity';

export type ProviderType = 
  | 'claude_code'
  | 'cursor'
  | 'claude_desktop'
  | 'openai'
  | 'gemini'
  | 'github_copilot';

@Entity('providers')
@Index(['name'], { unique: true })
export class ProviderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ 
    type: 'varchar', 
    length: 50, 
    unique: true,
    enum: ['claude_code', 'cursor', 'claude_desktop', 'openai', 'gemini', 'github_copilot']
  })
  name: ProviderType;

  @Column({ type: 'varchar', length: 100, name: 'display_name' })
  displayName: string;

  @Column({ type: 'jsonb', default: {} })
  config: Record<string, any>;

  @OneToMany(() => ProjectEntity, project => project.provider)
  projects: ProjectEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}