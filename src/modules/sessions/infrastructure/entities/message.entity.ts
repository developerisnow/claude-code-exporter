import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { SessionEntity } from './session.entity';

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

@Entity('messages')
@Index(['sessionId'])
@Index(['role'])
@Index(['createdAt'])
@Index(['sessionId', 'sequenceNumber'])
@Unique(['sessionId', 'sequenceNumber'])
export class MessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @Column({ name: 'sequence_number', type: 'int' })
  sequenceNumber: number;

  @Column({
    type: 'enum',
    enum: MessageRole,
  })
  role: MessageRole;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ name: 'structured_content', type: 'jsonb', nullable: true })
  structuredContent: any;

  @Column({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @Column({ name: 'is_tool_result', type: 'boolean', default: false })
  isToolResult: boolean;

  @Column({ name: 'is_system_generated', type: 'boolean', default: false })
  isSystemGenerated: boolean;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  // Relations
  @ManyToOne(() => SessionEntity, (session) => session.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_id' })
  session: SessionEntity;
}