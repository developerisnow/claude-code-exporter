import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { ProjectEntity } from '../../../projects/infrastructure/entities/project.entity';
import { ConversationTurnEntity } from './conversation-turn.entity';

@Entity('conversations')
@Index(['projectId', 'conversationDate'])
@Index(['filename'], { unique: true })
export class ConversationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  projectId: string;

  @ManyToOne(() => ProjectEntity, project => project.conversations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  @Column({ type: 'varchar', length: 255, unique: true })
  filename: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'timestamp', name: 'conversation_date' })
  conversationDate: Date;

  @Column({ type: 'boolean', default: false, name: 'is_summary' })
  isSummary: boolean;

  @Column({ type: 'uuid', nullable: true, name: 'parent_conversation_id' })
  parentConversationId: string | null;

  @ManyToOne(() => ConversationEntity, { nullable: true })
  @JoinColumn({ name: 'parent_conversation_id' })
  parentConversation: ConversationEntity | null;

  @OneToMany(() => ConversationTurnEntity, turn => turn.conversation)
  turns: ConversationTurnEntity[];

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}