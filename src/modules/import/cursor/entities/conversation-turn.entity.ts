import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ConversationEntity } from './conversation.entity';

export type RoleType = 'user' | 'assistant' | 'system' | 'tool';

@Entity('conversation_turns')
@Index(['conversationId', 'turnNumber'])
@Unique(['conversationId', 'turnNumber'])
export class ConversationTurnEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'conversation_id' })
  conversationId: string;

  @ManyToOne(() => ConversationEntity, conversation => conversation.turns, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation: ConversationEntity;

  @Column({ type: 'integer', name: 'turn_number' })
  turnNumber: number;

  @Column({ 
    type: 'varchar', 
    length: 20,
    enum: ['user', 'assistant', 'system', 'tool']
  })
  role: RoleType;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}