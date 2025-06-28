#!/usr/bin/env python3
"""
Setup local embeddings for RAG using sentence-transformers
This runs completely offline on your machine
"""

import os
import sys

print("🚀 Setting up local embeddings for RAG...\n")

# Check if we have the required packages
try:
    import psycopg2
    import numpy as np
    from sentence_transformers import SentenceTransformer
except ImportError:
    print("📦 Installing required packages...")
    os.system("pip install psycopg2-binary sentence-transformers numpy")
    import psycopg2
    import numpy as np
    from sentence_transformers import SentenceTransformer

# Database connection
conn = psycopg2.connect(
    host="localhost",
    database="claude_exporter",
    user="dev",
    password="dev_4223"
)
cur = conn.cursor()

print("📥 Loading embedding model (all-MiniLM-L6-v2)...")
print("   This model runs completely offline on your machine")
print("   First time will download ~90MB model file\n")

# Load the model - this is a good balance of speed and quality
# Alternatives: 
# - all-mpnet-base-v2 (better quality, slower)
# - all-MiniLM-L12-v2 (faster, slightly lower quality)
model = SentenceTransformer('all-MiniLM-L6-v2')

print("✅ Model loaded! Embedding dimension:", model.get_sentence_embedding_dimension())

# Test embedding
test_text = "This is a test sentence for vector search"
test_embedding = model.encode(test_text)
print(f"\n🧪 Test embedding generated: {test_embedding.shape}")

# Create helper functions
cur.execute("""
CREATE OR REPLACE FUNCTION compute_embeddings_batch(
    texts TEXT[],
    model_name VARCHAR DEFAULT 'all-MiniLM-L6-v2'
) RETURNS vector[]
AS $$
BEGIN
    -- This is a placeholder - actual computation happens in Python
    -- Return empty array for now
    RETURN ARRAY[]::vector[];
END;
$$ LANGUAGE plpgsql;
""")

# Create a simple example of how to use embeddings
print("\n📝 Creating example embeddings...")

# Get some sample messages
cur.execute("""
    SELECT id, content 
    FROM messages 
    WHERE content IS NOT NULL 
    AND length(content) > 50
    LIMIT 5
""")

messages = cur.fetchall()

if messages:
    print(f"\n🔄 Generating embeddings for {len(messages)} sample messages...")
    
    for msg_id, content in messages:
        # Truncate long content for embedding
        truncated = content[:1000] if len(content) > 1000 else content
        
        # Generate embedding
        embedding = model.encode(truncated)
        
        # Convert to PostgreSQL vector format
        embedding_str = '[' + ','.join(map(str, embedding.tolist())) + ']'
        
        # Update database
        cur.execute("""
            UPDATE messages 
            SET embedding = %s::vector,
                embedding_model = %s,
                embedding_created_at = NOW()
            WHERE id = %s
        """, (embedding_str, 'all-MiniLM-L6-v2', msg_id))
    
    conn.commit()
    print("✅ Sample embeddings created!")
    
    # Test similarity search
    print("\n🔍 Testing similarity search...")
    query = "How to implement authentication?"
    query_embedding = model.encode(query)
    query_embedding_str = '[' + ','.join(map(str, query_embedding.tolist())) + ']'
    
    cur.execute("""
        SELECT 
            id,
            substring(content, 1, 100) as preview,
            1 - (embedding <=> %s::vector) as similarity
        FROM messages
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> %s::vector
        LIMIT 3
    """, (query_embedding_str, query_embedding_str))
    
    results = cur.fetchall()
    if results:
        print(f"\nTop 3 similar messages for query: '{query}'")
        for i, (msg_id, preview, similarity) in enumerate(results, 1):
            print(f"{i}. Similarity: {similarity:.3f} - {preview}...")

conn.close()

print("\n✨ Setup complete!")
print("\n📚 What we've set up:")
print("1. pgvector extension for vector similarity search")
print("2. Embedding columns in messages and conversation_turns tables")
print("3. Local sentence-transformers model (all-MiniLM-L6-v2)")
print("4. Sample embeddings for testing")
print("\n🔧 Next steps:")
print("1. Create a script to embed all existing messages/conversations")
print("2. Set up automatic embedding for new imports")
print("3. Integrate with LlamaIndex or LangChain for RAG")
print("4. Consider using OpenAI embeddings for better quality (requires API key)")
print("\n💡 The model is cached locally at: ~/.cache/sentence_transformers/")