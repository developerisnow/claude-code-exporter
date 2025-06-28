#!/usr/bin/env python3
"""
Generate embeddings for all messages and conversations in the database
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import numpy as np
from sentence_transformers import SentenceTransformer
from tqdm import tqdm
import time
from datetime import datetime

# Configuration
BATCH_SIZE = 100
MODEL_NAME = 'all-MiniLM-L6-v2'
MAX_TEXT_LENGTH = 2000  # Truncate long texts

print("🚀 Starting embedding generation...\n")

# Database connection
conn = psycopg2.connect(
    host="localhost",
    database="claude_exporter",
    user="dev",
    password="dev_4223"
)

# Load model
print(f"📥 Loading model {MODEL_NAME}...")
model = SentenceTransformer(MODEL_NAME)
embedding_dim = model.get_sentence_embedding_dimension()
print(f"✅ Model loaded! Embedding dimension: {embedding_dim}\n")

def process_messages():
    """Generate embeddings for all messages without embeddings"""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Count messages needing embeddings
    cur.execute("""
        SELECT COUNT(*) as count
        FROM messages 
        WHERE content IS NOT NULL 
        AND content != ''
        AND embedding IS NULL
    """)
    total = cur.fetchone()['count']
    
    if total == 0:
        print("✅ All messages already have embeddings!")
        return
    
    print(f"📝 Processing {total} messages...")
    
    # Process in batches
    offset = 0
    processed = 0
    
    with tqdm(total=total, desc="Messages") as pbar:
        while offset < total:
            # Get batch
            cur.execute("""
                SELECT id, content
                FROM messages 
                WHERE content IS NOT NULL 
                AND content != ''
                AND embedding IS NULL
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
            """, (BATCH_SIZE, offset))
            
            batch = cur.fetchall()
            if not batch:
                break
            
            # Prepare texts
            texts = []
            ids = []
            for row in batch:
                text = row['content']
                # Truncate if too long
                if len(text) > MAX_TEXT_LENGTH:
                    text = text[:MAX_TEXT_LENGTH]
                texts.append(text)
                ids.append(row['id'])
            
            # Generate embeddings
            embeddings = model.encode(texts, show_progress_bar=False)
            
            # Update database
            update_cur = conn.cursor()
            for i, (msg_id, embedding) in enumerate(zip(ids, embeddings)):
                embedding_str = '[' + ','.join(map(str, embedding.tolist())) + ']'
                update_cur.execute("""
                    UPDATE messages 
                    SET embedding = %s::vector,
                        embedding_model = %s,
                        embedding_created_at = NOW()
                    WHERE id = %s
                """, (embedding_str, MODEL_NAME, msg_id))
            
            conn.commit()
            processed += len(batch)
            pbar.update(len(batch))
            
            offset += BATCH_SIZE
    
    print(f"✅ Processed {processed} messages\n")

def process_conversation_turns():
    """Generate embeddings for conversation turns"""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Count turns needing embeddings
    cur.execute("""
        SELECT COUNT(*) as count
        FROM conversation_turns 
        WHERE content IS NOT NULL 
        AND content != ''
        AND embedding IS NULL
    """)
    total = cur.fetchone()['count']
    
    if total == 0:
        print("✅ All conversation turns already have embeddings!")
        return
    
    print(f"💬 Processing {total} conversation turns...")
    
    # Process in batches
    offset = 0
    processed = 0
    
    with tqdm(total=total, desc="Turns") as pbar:
        while offset < total:
            # Get batch
            cur.execute("""
                SELECT id, content
                FROM conversation_turns 
                WHERE content IS NOT NULL 
                AND content != ''
                AND embedding IS NULL
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
            """, (BATCH_SIZE, offset))
            
            batch = cur.fetchall()
            if not batch:
                break
            
            # Prepare texts
            texts = []
            ids = []
            for row in batch:
                text = row['content']
                # Truncate if too long
                if len(text) > MAX_TEXT_LENGTH:
                    text = text[:MAX_TEXT_LENGTH]
                texts.append(text)
                ids.append(row['id'])
            
            # Generate embeddings
            embeddings = model.encode(texts, show_progress_bar=False)
            
            # Update database
            update_cur = conn.cursor()
            for i, (turn_id, embedding) in enumerate(zip(ids, embeddings)):
                embedding_str = '[' + ','.join(map(str, embedding.tolist())) + ']'
                update_cur.execute("""
                    UPDATE conversation_turns 
                    SET embedding = %s::vector,
                        embedding_model = %s,
                        embedding_created_at = NOW()
                    WHERE id = %s
                """, (embedding_str, MODEL_NAME, turn_id))
            
            conn.commit()
            processed += len(batch)
            pbar.update(len(batch))
            
            offset += BATCH_SIZE
    
    print(f"✅ Processed {processed} conversation turns\n")

def show_statistics():
    """Show embedding statistics"""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    print("📊 Embedding Statistics:")
    print("-" * 50)
    
    # Messages stats
    cur.execute("""
        SELECT 
            COUNT(*) as total,
            COUNT(embedding) as with_embeddings,
            COUNT(*) - COUNT(embedding) as without_embeddings
        FROM messages
        WHERE content IS NOT NULL AND content != ''
    """)
    msg_stats = cur.fetchone()
    print(f"Messages:")
    print(f"  Total: {msg_stats['total']:,}")
    print(f"  With embeddings: {msg_stats['with_embeddings']:,}")
    print(f"  Without embeddings: {msg_stats['without_embeddings']:,}")
    
    # Conversation turns stats
    cur.execute("""
        SELECT 
            COUNT(*) as total,
            COUNT(embedding) as with_embeddings,
            COUNT(*) - COUNT(embedding) as without_embeddings
        FROM conversation_turns
        WHERE content IS NOT NULL AND content != ''
    """)
    turn_stats = cur.fetchone()
    print(f"\nConversation turns:")
    print(f"  Total: {turn_stats['total']:,}")
    print(f"  With embeddings: {turn_stats['with_embeddings']:,}")
    print(f"  Without embeddings: {turn_stats['without_embeddings']:,}")

def main():
    start_time = time.time()
    
    # Show initial stats
    show_statistics()
    print()
    
    # Process messages
    process_messages()
    
    # Process conversation turns
    process_conversation_turns()
    
    # Show final stats
    print("\n" + "="*50)
    show_statistics()
    
    # Time taken
    elapsed = time.time() - start_time
    print(f"\n⏱️  Total time: {elapsed:.1f} seconds")
    
    conn.close()
    print("\n✨ Done!")

if __name__ == "__main__":
    main()