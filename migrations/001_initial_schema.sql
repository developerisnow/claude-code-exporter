-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    path VARCHAR(500) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    encoded_path VARCHAR(500) NOT NULL UNIQUE,
    first_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_path ON projects(path);
CREATE INDEX idx_projects_encoded_path ON projects(encoded_path);
CREATE INDEX idx_projects_last_updated ON projects(last_updated);

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    session_id VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(500),
    message_count INTEGER NOT NULL DEFAULT 0,
    user_message_count INTEGER NOT NULL DEFAULT 0,
    assistant_message_count INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    imported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_project_id ON sessions(project_id);
CREATE INDEX idx_sessions_session_id ON sessions(session_id);
CREATE INDEX idx_sessions_started_at ON sessions(started_at);
CREATE INDEX idx_sessions_imported_at ON sessions(imported_at);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    sequence_number INTEGER NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT,
    structured_content JSONB,
    created_at TIMESTAMP NOT NULL,
    is_tool_result BOOLEAN DEFAULT FALSE,
    is_system_generated BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_role ON messages(role);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_sequence ON messages(session_id, sequence_number);
CREATE UNIQUE INDEX idx_messages_unique_seq ON messages(session_id, sequence_number);

-- Exports table
CREATE TABLE exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    export_mode VARCHAR(20) NOT NULL CHECK (export_mode IN ('prompts', 'outputs', 'full')),
    export_format VARCHAR(20) NOT NULL CHECK (export_format IN ('markdown', 'json', 'txt')),
    file_path VARCHAR(500),
    message_count INTEGER NOT NULL DEFAULT 0,
    exported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    options JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exports_session_id ON exports(session_id);
CREATE INDEX idx_exports_exported_at ON exports(exported_at);
CREATE INDEX idx_exports_mode_format ON exports(export_mode, export_format);

-- Aggregate jobs table
CREATE TABLE aggregate_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    scheduled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_aggregate_jobs_project_id ON aggregate_jobs(project_id);
CREATE INDEX idx_aggregate_jobs_status ON aggregate_jobs(status);
CREATE INDEX idx_aggregate_jobs_scheduled_at ON aggregate_jobs(scheduled_at);

-- Aggregate results table
CREATE TABLE aggregate_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES aggregate_jobs(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    format VARCHAR(20) NOT NULL CHECK (format IN ('markdown', 'json', 'txt')),
    prompt_count INTEGER NOT NULL DEFAULT 0,
    session_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_aggregate_results_job_id ON aggregate_results(job_id);
CREATE INDEX idx_aggregate_results_project_id ON aggregate_results(project_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_aggregate_jobs_updated_at BEFORE UPDATE ON aggregate_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries
CREATE VIEW project_statistics AS
SELECT 
    p.id,
    p.path,
    p.name,
    COUNT(DISTINCT s.id) as session_count,
    SUM(s.user_message_count) as total_prompts,
    SUM(s.assistant_message_count) as total_outputs,
    SUM(s.message_count) as total_messages,
    MIN(s.started_at) as first_session,
    MAX(s.ended_at) as last_session,
    p.last_updated
FROM projects p
LEFT JOIN sessions s ON p.id = s.project_id
GROUP BY p.id, p.path, p.name, p.last_updated;

-- Permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO claude_exporter;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO claude_exporter;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO claude_exporter;