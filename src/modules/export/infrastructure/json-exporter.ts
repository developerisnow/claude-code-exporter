import { Injectable } from '@nestjs/common';
import { Session } from '../../sessions/domain/session.entity';
import { Prompt } from '../../prompts/domain/prompt.entity';
import { ExportMode } from '../domain/export-format.enum';

export interface JsonExportData {
  sessions: Array<{
    session: Session;
    prompts: Prompt[];
  }>;
  mode: ExportMode;
}

@Injectable()
export class JsonExporter {
  export(data: JsonExportData): string {
    const exportObject = {
      exportMode: data.mode,
      exportDate: new Date().toISOString(),
      sessions: data.sessions.map(({ session, prompts }) => ({
        sessionId: session.id.toString(),
        projectPath: session.projectPath,
        createdAt: session.createdAt.toISOString(),
        metadata: session.metadata,
        statistics: {
          totalPrompts: prompts.length,
          userPrompts: prompts.filter(p => p.isUserRole()).length,
          assistantPrompts: prompts.filter(p => p.isAssistantRole()).length,
        },
        messages: prompts.map(prompt => ({
          role: prompt.role,
          content: prompt.content,
          timestamp: prompt.timestamp.toISOString(),
          metadata: prompt.metadata,
          statistics: {
            contentLength: prompt.getContentLength(),
            wordCount: prompt.getWordCount(),
          },
        })),
      })),
    };
    
    return JSON.stringify(exportObject, null, 2);
  }
}