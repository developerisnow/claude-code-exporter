-- Migration: Add vector search capabilities with pgvector
-- Version: 003
-- Description: Adds embeddings support for RAG (Retrieval-Augmented Generation)

-- Enable vector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding columns to messages table
ALTER TABLE messages 
    ADD COLUMN IF NOT EXISTS embedding vector(768),  -- 768 dimensions for all-MiniLM-L6-v2
    ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(100),
    ADD COLUMN IF NOT EXISTS embedding_created_at TIMESTAMP;

-- Add embedding columns to conversation_turns table
ALTER TABLE conversation_turns
    ADD COLUMN IF NOT EXISTS embedding vector(768),
    ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(100),
    ADD COLUMN IF NOT EXISTS embedding_created_at TIMESTAMP;

-- Create indexes for vector similarity search
CREATE INDEX IF NOT EXISTS idx_messages_embedding 
    ON messages USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_conversation_turns_embedding 
    ON conversation_turns USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Create a table for document chunks (for larger documents)
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_type VARCHAR(50) NOT NULL, -- 'message', 'conversation_turn', 'document'
    source_id UUID NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    embedding vector(768),
    embedding_model VARCHAR(100),
    token_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_type, source_id, chunk_index)
);

CREATE INDEX idx_chunks_embedding 
    ON document_chunks USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

CREATE INDEX idx_chunks_source 
    ON document_chunks(source_type, source_id);

-- Create a function for semantic search
CREATE OR REPLACE FUNCTION search_similar_content(
    query_embedding vector(768),
    limit_count INTEGER DEFAULT 10,
    similarity_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    source_type VARCHAR,
    similarity FLOAT,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dc.id,
        dc.content,
        dc.source_type,
        1 - (dc.embedding <=> query_embedding) as similarity,
        dc.metadata
    FROM document_chunks dc
    WHERE dc.embedding IS NOT NULL
    AND 1 - (dc.embedding <=> query_embedding) > similarity_threshold
    ORDER BY dc.embedding <=> query_embedding
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create a materialized view for conversation summaries
CREATE MATERIALIZED VIEW IF NOT EXISTS conversation_embeddings AS
SELECT 
    c.id as conversation_id,
    c.project_id,
    c.title,
    c.conversation_date,
    p.name as project_name,
    pr.name as provider,
    string_agg(ct.content, E'\n' ORDER BY ct.turn_number) as full_content,
    COUNT(ct.id) as turn_count
FROM conversations c
JOIN projects p ON c.project_id = p.id
JOIN providers pr ON p.provider_id = pr.id
LEFT JOIN conversation_turns ct ON c.id = ct.conversation_id
GROUP BY c.id, c.project_id, c.title, c.conversation_date, p.name, pr.name;

-- Add embedding column to the materialized view
ALTER TABLE conversation_embeddings 
    ADD COLUMN embedding vector(768),
    ADD COLUMN embedding_model VARCHAR(100),
    ADD COLUMN embedding_created_at TIMESTAMP;

CREATE INDEX idx_conversation_embeddings 
    ON conversation_embeddings USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 50);

-- Create a table to track embedding jobs
CREATE TABLE IF NOT EXISTS embedding_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_type VARCHAR(50) NOT NULL, -- 'bulk', 'incremental', 'single'
    status VARCHAR(20) DEFAULT 'pending',
    total_items INTEGER,
    processed_items INTEGER DEFAULT 0,
    failed_items INTEGER DEFAULT 0,
    model VARCHAR(100),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Function to find similar conversations
CREATE OR REPLACE FUNCTION find_similar_conversations(
    query_text TEXT,
    limit_count INTEGER DEFAULT 5
)
RETURNS TABLE (
    conversation_id UUID,
    title VARCHAR,
    project_name VARCHAR,
    provider VARCHAR,
    similarity FLOAT
) AS $$
DECLARE
    query_embedding vector(768);
BEGIN
    -- This would normally call your embedding model
    -- For now, returning empty result
    -- In production, you'd compute embedding for query_text
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON COLUMN messages.embedding IS 'Vector embedding for semantic search';
COMMENT ON COLUMN conversation_turns.embedding IS 'Vector embedding for semantic search';
COMMENT ON TABLE document_chunks IS 'Stores text chunks with embeddings for RAG';
COMMENT ON FUNCTION search_similar_content IS 'Performs semantic similarity search on content';
COMMENT ON MATERIALIZED VIEW conversation_embeddings IS 'Pre-aggregated conversation content for faster embedding';