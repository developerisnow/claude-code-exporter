export interface RawMessage {
  role: string;
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface RawSessionData {
  sessionId?: string;
  projectPath: string;
  messages: RawMessage[];
  createdAt?: string;
  metadata?: Record<string, any>;
}

export interface IClaudeSessionParser {
  parse(projectPath: string): Promise<RawSessionData[]>;
}
