import { Injectable } from '@nestjs/common';
import { Session } from '../../sessions/domain/session.entity';
import { Prompt, Role } from '../../prompts/domain/prompt.entity';
import { SessionId, PromptId } from '../../common/domain/value-objects';
import { RawSessionData, RawMessage } from './claude-session-parser.interface';

@Injectable()
export class SessionFactory {
  createFromRaw(rawData: RawSessionData): Session {
    // Create session
    const session = new Session({
      id: rawData.sessionId ? SessionId.fromString(rawData.sessionId) : undefined,
      projectPath: rawData.projectPath,
      createdAt: rawData.createdAt ? new Date(rawData.createdAt) : new Date(),
      metadata: rawData.metadata || {},
    });

    // Create and add prompts
    for (const rawMessage of rawData.messages) {
      const prompt = this.createPromptFromRaw(rawMessage, session.id);
      session.addPrompt(prompt);
    }

    return session;
  }

  private createPromptFromRaw(rawMessage: RawMessage, sessionId: SessionId): Prompt {
    const role = this.mapRole(rawMessage.role);
    
    return new Prompt({
      sessionId,
      role,
      content: rawMessage.content,
      timestamp: new Date(rawMessage.timestamp),
      metadata: rawMessage.metadata || {},
    });
  }

  private mapRole(rawRole: string): Role {
    const normalizedRole = rawRole.toLowerCase();
    
    switch (normalizedRole) {
      case 'user':
      case 'human':
        return Role.USER;
      case 'assistant':
      case 'ai':
      case 'claude':
        return Role.ASSISTANT;
      case 'system':
        return Role.SYSTEM;
      default:
        throw new Error(`Unknown role: ${rawRole}`);
    }
  }
}