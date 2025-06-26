import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('export_history')
export class ExportHistoryEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('text')
  project_path: string;

  @Column('text')
  export_format: string;

  @Column('text')
  export_mode: string;

  @Column('text')
  output_path: string;

  @Column('integer')
  files_created: number;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  created_at: Date;
}
