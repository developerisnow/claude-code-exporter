import { Entity, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('prompt_topics')
export class PromptTopicEntity {
  @PrimaryColumn('uuid')
  prompt_id: string;

  @PrimaryColumn('uuid')
  topic_id: string;

  @CreateDateColumn()
  created_at: Date;
}
