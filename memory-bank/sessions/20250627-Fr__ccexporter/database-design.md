# 🗄️ Claude Exporter Database Design

## 📊 Entity Relationship Diagram

```mermaid
erDiagram
    projects ||--o{ sessions : "has"
    sessions ||--o{ messages : "contains"
    sessions ||--o{ exports : "exported to"
    projects ||--o{ aggregate_jobs : "scheduled for"
    aggregate_jobs ||--o{ aggregate_results : "produces"
    
    projects {
        uuid id PK
        string path UK "Unique project path"
        string name
        string encoded_path UK "Claude's encoded path"
        timestamp first_seen
        timestamp last_updated
        jsonb metadata
    }
    
    sessions {
        uuid id PK
        uuid project_id FK
        string session_id UK "Claude session ID"
        string title
        integer message_count
        integer user_message_count
        integer assistant_message_count
        timestamp started_at
        timestamp ended_at
        timestamp imported_at
        jsonb metadata
    }
    
    messages {
        uuid id PK
        uuid session_id FK
        integer sequence_number
        string role "user|assistant|system"
        text content
        jsonb structured_content "For complex messages"
        timestamp created_at
        boolean is_tool_result
        boolean is_system_generated
        jsonb metadata
    }
    
    exports {
        uuid id PK
        uuid session_id FK
        string export_mode "prompts|outputs|full"
        string export_format "markdown|json|txt"
        string file_path
        integer message_count
        timestamp exported_at
        jsonb options
    }
    
    aggregate_jobs {
        uuid id PK
        uuid project_id FK "NULL for all projects"
        string status "pending|processing|completed|failed"
        timestamp scheduled_at
        timestamp started_at
        timestamp completed_at
        text error_message
        jsonb config
    }
    
    aggregate_results {
        uuid id PK
        uuid job_id FK
        uuid project_id FK
        string file_path
        string format "markdown|json|txt"
        integer prompt_count
        integer session_count
        timestamp created_at
    }
```

## 🔄 Data Flow Sequence

```mermaid
sequenceDiagram
    participant CLI
    participant ImportUseCase
    participant SessionRepo
    participant MessageRepo
    participant FileSystem
    participant DB

    CLI->>ImportUseCase: import(projectPath)
    ImportUseCase->>FileSystem: findSessionFiles()
    FileSystem-->>ImportUseCase: sessionFiles[]
    
    loop For each session
        ImportUseCase->>FileSystem: readJSONL(file)
        FileSystem-->>ImportUseCase: messages[]
        ImportUseCase->>SessionRepo: upsert(session)
        SessionRepo->>DB: INSERT/UPDATE
        ImportUseCase->>MessageRepo: bulkInsert(messages)
        MessageRepo->>DB: INSERT
    end
    
    ImportUseCase-->>CLI: ImportResult
```

## 🏗️ Architecture Flow

```mermaid
flowchart TB
    subgraph CLI["CLI Layer"]
        CP[claude-prompts]
        CI[claude-import]
        CA[claude-aggregate]
    end
    
    subgraph APP["Application Layer"]
        IUC[ImportSessionUseCase]
        EUC[ExportSessionUseCase]
        AUC[AggregateByProjectUseCase]
    end
    
    subgraph DOMAIN["Domain Layer"]
        SE[Session Entity]
        ME[Message Entity]
        PE[Project Entity]
        SF[SessionFactory]
        VR[Validation Rules]
    end
    
    subgraph INFRA["Infrastructure Layer"]
        SR[SessionRepository]
        MR[MessageRepository]
        PR[ProjectRepository]
        FS[FileSystemAdapter]
        PG[(PostgreSQL)]
    end
    
    CP --> IUC
    CP --> EUC
    CA --> AUC
    
    IUC --> SE
    IUC --> SF
    EUC --> SE
    AUC --> PE
    
    SE --> SR
    ME --> MR
    PE --> PR
    
    SR --> PG
    MR --> PG
    PR --> PG
    
    IUC --> FS
    EUC --> FS
```

## 📈 State Machine

```mermaid
stateDiagram-v2
    [*] --> FileSystem: Claude writes session
    FileSystem --> Discovered: Import command
    Discovered --> Importing: Process JSONL
    Importing --> Imported: Success
    Importing --> Failed: Error
    Failed --> Importing: Retry
    Imported --> Exportable: In database
    Exportable --> Exporting: Export command
    Exporting --> Exported: Files created
    Exported --> [*]
    
    Imported --> Aggregating: Aggregate job
    Aggregating --> Aggregated: Combined files
    Aggregated --> [*]
```

## 🔑 Key Design Decisions

### 1. **UUID Primary Keys**
- Better for distributed systems
- No sequence bottlenecks
- Easier data migration

### 2. **JSONB Metadata Fields**
- Flexibility for future Claude format changes
- Store raw data without schema changes
- Enable advanced queries

### 3. **Separate Projects Table**
- Efficient aggregation queries
- Track project-level metrics
- Enable project-wide operations

### 4. **Async Job Processing**
- Non-blocking aggregation
- Schedulable operations
- Error recovery

### 5. **Structured Content Storage**
- `content`: Plain text for simple queries
- `structured_content`: Original format preservation
- Best of both worlds

## 🚀 Migration Strategy

```sql
-- 1. Create projects from existing sessions
INSERT INTO projects (path, name, encoded_path, first_seen, last_updated)
SELECT DISTINCT 
    decoded_path as path,
    basename(decoded_path) as name,
    encoded_path,
    MIN(created_at) as first_seen,
    MAX(updated_at) as last_updated
FROM (
    -- Decode paths from session files
) AS decoded_sessions
ON CONFLICT (path) DO UPDATE SET
    last_updated = EXCLUDED.last_updated;

-- 2. Link sessions to projects
UPDATE sessions s
SET project_id = p.id
FROM projects p
WHERE s.project_path = p.path;
```

## 🔍 Query Examples

### Get all prompts for a project
```sql
SELECT m.content, m.created_at, s.title
FROM messages m
JOIN sessions s ON m.session_id = s.id
JOIN projects p ON s.project_id = p.id
WHERE p.path = '/path/to/project'
  AND m.role = 'user'
  AND m.is_system_generated = false
ORDER BY m.created_at;
```

### Aggregate stats by project
```sql
SELECT 
    p.name,
    COUNT(DISTINCT s.id) as session_count,
    SUM(s.user_message_count) as total_prompts,
    MIN(s.started_at) as first_session,
    MAX(s.ended_at) as last_session
FROM projects p
JOIN sessions s ON p.id = s.project_id
GROUP BY p.id, p.name
ORDER BY total_prompts DESC;
```

## 🛡️ Security Considerations

1. **Row-Level Security**: Future multi-user support
2. **Encrypted Storage**: For sensitive prompts
3. **Audit Trail**: Track who exported what
4. **Data Retention**: Configurable cleanup policies