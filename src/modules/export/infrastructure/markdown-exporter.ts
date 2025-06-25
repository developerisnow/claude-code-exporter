import { Injectable } from '@nestjs/common';
import { Session } from '../../sessions/domain/session.entity';
import { Prompt } from '../../prompts/domain/prompt.entity';
import { ExportMode } from '../domain/export-format.enum';

export interface MarkdownExportData {
  sessions: Array<{
    session: Session;
    prompts: Prompt[];
  }>;
  mode: ExportMode;
}

@Injectable()
export class MarkdownExporter {
  export(data: MarkdownExportData): string {
    const lines: string[] = [];
    
    // Header
    lines.push('# Claude Code Session Export');
    lines.push('');
    lines.push(`**Export Mode**: ${this.formatMode(data.mode)}`);
    lines.push(`**Export Date**: ${new Date().toISOString()}`);
    lines.push('');
    
    // Sessions
    for (const { session, prompts } of data.sessions) {
      lines.push('---');
      lines.push('');
      lines.push(`## Session: ${session.id.toString()}`);
      lines.push('');
      lines.push(`**Project Path**: ${session.projectPath}`);
      lines.push(`**Created At**: ${session.createdAt.toISOString()}`);
      lines.push(`**Total Prompts**: ${prompts.length}`);
      lines.push('');
      
      // Prompts
      if (prompts.length > 0) {
        lines.push('### Messages');
        lines.push('');
        
        for (const prompt of prompts) {
          lines.push(`#### ${this.formatRole(prompt.role)} - ${prompt.timestamp.toISOString()}`);
          lines.push('');
          lines.push('```');
          lines.push(prompt.content);
          lines.push('```');
          lines.push('');
        }
      }
    }
    
    return lines.join('\n');
  }
  
  private formatMode(mode: ExportMode): string {
    switch (mode) {
      case ExportMode.PROMPTS_ONLY:
        return 'Prompts Only';
      case ExportMode.OUTPUTS_ONLY:
        return 'Outputs Only';
      case ExportMode.FULL_CONVERSATION:
        return 'Full Conversation';
      default:
        return mode;
    }
  }
  
  private formatRole(role: string): string {
    return role.charAt(0).toUpperCase() + role.slice(1);
  }
}