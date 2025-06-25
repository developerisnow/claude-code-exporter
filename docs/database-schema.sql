-- Claude Code Exporter v2 Database Schema
-- PostgreSQL 14+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for sessions
CREATE INDEX idx_sessions_project_path ON sessions(project_path);
CREATE INDEX idx_sessions_created_at ON sessions(created_at);
CREATE INDEX idx_sessions_metadata ON sessions USING GIN(metadata);

-- Prompts table
CREATE TABLE prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB DEFAULT '{}',
    content_length INTEGER GENERATED ALWAYS AS (LENGTH(content)) STORED,
    word_count INTEGER GENERATED ALWAYS AS (
        array_length(
            string_to_array(
                regexp_replace(content, '[^\w\s]', '', 'g'), 
                ' '
            ), 
            1
        )
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for prompts
CREATE INDEX idx_prompts_session_id ON prompts(session_id);
CREATE INDEX idx_prompts_timestamp ON prompts(timestamp);
CREATE INDEX idx_prompts_role ON prompts(role);
CREATE INDEX idx_prompts_session_timestamp ON prompts(session_id, timestamp);
CREATE INDEX idx_prompts_content_fulltext ON prompts USING GIN(to_tsvector('english', content));

-- Topics table
CREATE TABLE topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    rules JSONB NOT NULL DEFAULT '{"keywords": [], "patterns": [], "excludeKeywords": []}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for topics
CREATE INDEX idx_topics_name ON topics(name);
CREATE INDEX idx_topics_created_at ON topics(created_at);

-- Prompt-Topic associations
CREATE TABLE prompt_topics (
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    confidence FLOAT NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by VARCHAR(50) DEFAULT 'system',
    PRIMARY KEY (prompt_id, topic_id)
);

-- Indexes for prompt_topics
CREATE INDEX idx_prompt_topics_topic_id ON prompt_topics(topic_id);
CREATE INDEX idx_prompt_topics_confidence ON prompt_topics(confidence);

-- Daily aggregations table (for caching)
CREATE TABLE daily_aggregations (
    date DATE PRIMARY KEY,
    session_count INTEGER NOT NULL DEFAULT 0,
    prompt_count INTEGER NOT NULL DEFAULT 0,
    user_prompt_count INTEGER NOT NULL DEFAULT 0,
    assistant_prompt_count INTEGER NOT NULL DEFAULT 0,
    avg_prompt_length FLOAT NOT NULL DEFAULT 0,
    avg_word_count FLOAT NOT NULL DEFAULT 0,
    topic_distribution JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for daily_aggregations
CREATE INDEX idx_daily_aggregations_date ON daily_aggregations(date DESC);

-- Export history table
CREATE TABLE export_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    format VARCHAR(50) NOT NULL CHECK (format IN ('markdown', 'json', 'csv')),
    filters JSONB DEFAULT '{}',
    file_path VARCHAR(500),
    file_size BIGINT,
    record_count INTEGER,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255)
);

-- Indexes for export_history
CREATE INDEX idx_export_history_status ON export_history(status);
CREATE INDEX idx_export_history_created_at ON export_history(started_at DESC);

-- =====================================================
-- MATERIALIZED VIEWS
-- =====================================================

-- Daily session statistics
CREATE MATERIALIZED VIEW mv_daily_session_stats AS
SELECT 
    DATE(s.created_at) as date,
    COUNT(DISTINCT s.id) as session_count,
    COUNT(p.id) as total_prompts,
    COUNT(p.id) FILTER (WHERE p.role = 'user') as user_prompts,
    COUNT(p.id) FILTER (WHERE p.role = 'assistant') as assistant_prompts,
    AVG(p.content_length)::FLOAT as avg_prompt_length,
    AVG(p.word_count)::FLOAT as avg_word_count,
    MIN(p.timestamp) as first_prompt_at,
    MAX(p.timestamp) as last_prompt_at
FROM sessions s
LEFT JOIN prompts p ON s.id = p.session_id
GROUP BY DATE(s.created_at);

-- Create indexes on materialized view
CREATE INDEX idx_mv_daily_stats_date ON mv_daily_session_stats(date DESC);

-- Topic statistics
CREATE MATERIALIZED VIEW mv_topic_stats AS
SELECT 
    t.id as topic_id,
    t.name as topic_name,
    DATE(p.timestamp) as date,
    COUNT(DISTINCT pt.prompt_id) as prompt_count,
    COUNT(DISTINCT p.session_id) as session_count,
    AVG(pt.confidence)::FLOAT as avg_confidence,
    COUNT(DISTINCT pt.prompt_id) FILTER (WHERE pt.confidence >= 0.8) as high_confidence_count
FROM topics t
JOIN prompt_topics pt ON t.id = pt.topic_id
JOIN prompts p ON pt.prompt_id = p.id
GROUP BY t.id, t.name, DATE(p.timestamp);

-- Create indexes on materialized view
CREATE INDEX idx_mv_topic_stats_date ON mv_topic_stats(date DESC);
CREATE INDEX idx_mv_topic_stats_topic_id ON mv_topic_stats(topic_id);

-- Weekly aggregations
CREATE MATERIALIZED VIEW mv_weekly_stats AS
SELECT 
    DATE_TRUNC('week', date) as week_start,
    SUM(session_count) as session_count,
    SUM(prompt_count) as prompt_count,
    SUM(user_prompt_count) as user_prompt_count,
    SUM(assistant_prompt_count) as assistant_prompt_count,
    AVG(avg_prompt_length) as avg_prompt_length
FROM daily_aggregations
GROUP BY DATE_TRUNC('week', date);

-- Monthly aggregations
CREATE MATERIALIZED VIEW mv_monthly_stats AS
SELECT 
    DATE_TRUNC('month', date) as month_start,
    SUM(session_count) as session_count,
    SUM(prompt_count) as prompt_count,
    SUM(user_prompt_count) as user_prompt_count,
    SUM(assistant_prompt_count) as assistant_prompt_count,
    AVG(avg_prompt_length) as avg_prompt_length
FROM daily_aggregations
GROUP BY DATE_TRUNC('month', date);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_all_stats_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_session_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_topic_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_weekly_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_stats;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate topic confidence
CREATE OR REPLACE FUNCTION calculate_topic_confidence(
    prompt_content TEXT,
    topic_rules JSONB
) RETURNS FLOAT AS $$
DECLARE
    confidence FLOAT := 0;
    keyword TEXT;
    pattern TEXT;
BEGIN
    -- Check keywords
    FOR keyword IN SELECT jsonb_array_elements_text(topic_rules->'keywords')
    LOOP
        IF position(lower(keyword) IN lower(prompt_content)) > 0 THEN
            confidence := confidence + 0.2;
        END IF;
    END LOOP;
    
    -- Check patterns (simplified for SQL)
    FOR pattern IN SELECT jsonb_array_elements_text(topic_rules->'patterns')
    LOOP
        IF prompt_content ~ pattern THEN
            confidence := confidence + 0.3;
        END IF;
    END LOOP;
    
    -- Check exclude keywords
    FOR keyword IN SELECT jsonb_array_elements_text(topic_rules->'excludeKeywords')
    LOOP
        IF position(lower(keyword) IN lower(prompt_content)) > 0 THEN
            confidence := confidence - 0.5;
        END IF;
    END LOOP;
    
    -- Normalize to 0-1 range
    RETURN GREATEST(0, LEAST(1, confidence));
END;
$$ LANGUAGE plpgsql;

-- Function to auto-assign topics to new prompts
CREATE OR REPLACE FUNCTION auto_assign_topics()
RETURNS TRIGGER AS $$
DECLARE
    topic RECORD;
    confidence FLOAT;
BEGIN
    FOR topic IN SELECT * FROM topics
    LOOP
        confidence := calculate_topic_confidence(NEW.content, topic.rules);
        
        IF confidence >= 0.5 THEN
            INSERT INTO prompt_topics (prompt_id, topic_id, confidence, assigned_by)
            VALUES (NEW.id, topic.id, confidence, 'auto')
            ON CONFLICT (prompt_id, topic_id) DO NOTHING;
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_topics_updated_at
    BEFORE UPDATE ON topics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Auto-assign topics trigger
CREATE TRIGGER auto_assign_topics_on_insert
    AFTER INSERT ON prompts
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_topics();

-- Update daily aggregations trigger
CREATE OR REPLACE FUNCTION update_daily_aggregations()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert daily aggregation
    INSERT INTO daily_aggregations (
        date,
        session_count,
        prompt_count,
        user_prompt_count,
        assistant_prompt_count,
        avg_prompt_length,
        avg_word_count
    )
    SELECT 
        DATE(NEW.timestamp),
        COUNT(DISTINCT s.id),
        COUNT(p.id),
        COUNT(p.id) FILTER (WHERE p.role = 'user'),
        COUNT(p.id) FILTER (WHERE p.role = 'assistant'),
        AVG(p.content_length)::FLOAT,
        AVG(p.word_count)::FLOAT
    FROM prompts p
    JOIN sessions s ON p.session_id = s.id
    WHERE DATE(p.timestamp) = DATE(NEW.timestamp)
    ON CONFLICT (date) DO UPDATE SET
        session_count = EXCLUDED.session_count,
        prompt_count = EXCLUDED.prompt_count,
        user_prompt_count = EXCLUDED.user_prompt_count,
        assistant_prompt_count = EXCLUDED.assistant_prompt_count,
        avg_prompt_length = EXCLUDED.avg_prompt_length,
        avg_word_count = EXCLUDED.avg_word_count,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_daily_aggregations_on_prompt_insert
    AFTER INSERT ON prompts
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_aggregations();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Partial indexes for common queries
CREATE INDEX idx_prompts_user_recent ON prompts(timestamp DESC) 
    WHERE role = 'user' AND timestamp > CURRENT_DATE - INTERVAL '30 days';

CREATE INDEX idx_prompts_assistant_recent ON prompts(timestamp DESC) 
    WHERE role = 'assistant' AND timestamp > CURRENT_DATE - INTERVAL '30 days';

-- BRIN index for time-series data
CREATE INDEX idx_prompts_timestamp_brin ON prompts USING BRIN(timestamp);

-- =====================================================
-- PERMISSIONS (adjust as needed)
-- =====================================================

-- Create application role
CREATE ROLE claude_exporter_app WITH LOGIN PASSWORD 'change_me_in_production';

-- Grant permissions
GRANT CONNECT ON DATABASE claude_exporter TO claude_exporter_app;
GRANT USAGE ON SCHEMA public TO claude_exporter_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO claude_exporter_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO claude_exporter_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO claude_exporter_app;