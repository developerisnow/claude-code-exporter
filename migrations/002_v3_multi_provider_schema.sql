-- Migration: Add multi-provider support and enhanced schema
-- Version: 002
-- Description: Extends database to support multiple AI providers, tool calls, and flexible message types

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- Create custom types
CREATE TYPE message_type AS ENUM (
    'text',          -- Regular text message
    'code',          -- Code blocks
    'tool_use',      -- Tool invocation
    'tool_result',   -- Tool response
    'thinking',      -- Internal reasoning
    'system',        -- System messages
    'error'          -- Error messages
);

CREATE TYPE role_type AS ENUM (
    'user',
    'assistant', 
    'system',
    'tool'
);

CREATE TYPE provider_type AS ENUM (
    'claude_code',
    'cursor',
    'claude_desktop',
    'openai',
    'gemini',
    'github_copilot'
);

-- Create providers table
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name provider_type UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed providers
INSERT INTO providers (name, display_name) VALUES
    ('claude_code', 'Claude Code'),
    ('cursor', 'Cursor IDE'),
    ('claude_desktop', 'Claude Desktop'),
    ('openai', 'OpenAI/ChatGPT'),
    ('gemini', 'Google Gemini'),
    ('github_copilot', 'GitHub Copilot');

-- Add provider support to projects
ALTER TABLE projects 
    ADD COLUMN provider_id UUID REFERENCES providers(id),
    ADD COLUMN project_type VARCHAR(50) DEFAULT 'claude_code';

-- Update existing projects to claude_code provider
UPDATE projects 
SET provider_id = (SELECT id FROM providers WHERE name = 'claude_code')
WHERE provider_id IS NULL;

-- Make provider_id required after migration
ALTER TABLE projects ALTER COLUMN provider_id SET NOT NULL;

-- Create conversations table for Cursor support
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    filename VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    conversation_date TIMESTAMP NOT NULL,
    is_summary BOOLEAN DEFAULT FALSE,
    parent_conversation_id UUID REFERENCES conversations(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create conversation turns
CREATE TABLE conversation_turns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    turn_number INTEGER NOT NULL,
    role role_type NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(conversation_id, turn_number)
);

-- Enhance messages table
ALTER TABLE messages
    ADD COLUMN message_type message_type DEFAULT 'text',
    ADD COLUMN conversation_turn_id UUID REFERENCES conversation_turns(id),
    ADD COLUMN content_array JSONB,
    ADD COLUMN token_count INTEGER,
    ADD COLUMN metadata JSONB DEFAULT '{}';

-- Create tool_calls table
CREATE TABLE tool_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    tool_name VARCHAR(100) NOT NULL,
    tool_type VARCHAR(50) NOT NULL,
    parameters JSONB,
    result JSONB,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'error')),
    error_message TEXT,
    executed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create message_attachments table
CREATE TABLE message_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('image', 'file', 'code_block')),
    filename VARCHAR(255),
    mime_type VARCHAR(100),
    content TEXT,
    url VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add tool_call_count to sessions
ALTER TABLE sessions
    ADD COLUMN tool_call_count INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX idx_projects_provider ON projects(provider_id);
CREATE INDEX idx_conversations_project ON conversations(project_id);
CREATE INDEX idx_conversations_date ON conversations(conversation_date);
CREATE INDEX idx_conversations_summary ON conversations(is_summary);
CREATE INDEX idx_conversation_turns_conv ON conversation_turns(conversation_id);
CREATE INDEX idx_messages_type ON messages(message_type);
CREATE INDEX idx_messages_session_type ON messages(session_id, message_type);
CREATE INDEX idx_messages_turn ON messages(conversation_turn_id);
CREATE INDEX idx_tool_calls_message ON tool_calls(message_id);
CREATE INDEX idx_tool_calls_name ON tool_calls(tool_name);
CREATE INDEX idx_tool_calls_status ON tool_calls(status);
CREATE INDEX idx_attachments_message ON message_attachments(message_id);
CREATE INDEX idx_attachments_type ON message_attachments(type);

-- Full-text search indexes
CREATE INDEX idx_messages_content_gin ON messages USING gin(to_tsvector('english', content));
CREATE INDEX idx_conversations_title_gin ON conversations USING gin(to_tsvector('english', title));
CREATE INDEX idx_conversation_turns_content_gin ON conversation_turns USING gin(to_tsvector('english', content));

-- JSONB indexes for metadata
CREATE INDEX idx_messages_metadata ON messages USING gin(metadata);
CREATE INDEX idx_tool_calls_params ON tool_calls USING gin(parameters);
CREATE INDEX idx_tool_calls_result ON tool_calls USING gin(result);

-- Create materialized view for statistics
CREATE MATERIALIZED VIEW project_statistics AS
SELECT 
    p.id as project_id,
    p.path,
    pr.name as provider,
    COUNT(DISTINCT s.id) as session_count,
    COUNT(DISTINCT c.id) as conversation_count,
    COALESCE(SUM(s.message_count), 0) as total_messages,
    COALESCE(SUM(s.user_message_count), 0) as total_prompts,
    COALESCE(SUM(s.assistant_message_count), 0) as total_outputs,
    COALESCE(SUM(s.tool_call_count), 0) as total_tool_calls,
    MIN(LEAST(s.started_at, c.conversation_date)) as first_activity,
    MAX(GREATEST(s.ended_at, c.conversation_date)) as last_activity
FROM projects p
LEFT JOIN providers pr ON p.provider_id = pr.id
LEFT JOIN sessions s ON p.id = s.project_id
LEFT JOIN conversations c ON p.id = c.project_id
GROUP BY p.id, p.path, pr.name;

-- Create index on materialized view
CREATE UNIQUE INDEX idx_project_statistics_id ON project_statistics(project_id);

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Performance settings for large tables
ALTER TABLE messages SET (autovacuum_vacuum_scale_factor = 0.01);
ALTER TABLE tool_calls SET (autovacuum_vacuum_scale_factor = 0.02);
ALTER TABLE conversation_turns SET (autovacuum_vacuum_scale_factor = 0.02);

-- Add comments for documentation
COMMENT ON TABLE providers IS 'Supported AI providers (Claude, Cursor, OpenAI, etc)';
COMMENT ON TABLE conversations IS 'Cursor-style markdown conversations';
COMMENT ON TABLE tool_calls IS 'Tool/function calls from AI assistants';
COMMENT ON TABLE message_attachments IS 'Images, files, and code blocks attached to messages';
COMMENT ON COLUMN messages.message_type IS 'Type of message content for filtering';
COMMENT ON COLUMN messages.content_array IS 'For Claude structured content format';
COMMENT ON COLUMN conversations.is_summary IS 'Whether this is a summary of a longer conversation';