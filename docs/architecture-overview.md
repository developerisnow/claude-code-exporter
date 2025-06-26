# 🏗️ Claude Code Exporter v2 - Architecture Overview

## 🎯 System Overview

```mermaid
graph TB
    subgraph "Claude Code"
        CC[Claude Code IDE]
    end
    
    subgraph "File System"
        CS[~/.config/claude/projects/]
        JSONL[Session JSONL Files]
    end
    
    subgraph "Claude Exporter v2"
        CLI[CLI Commands]
        API[REST API]
        WS[WebSocket]
        CRON[Cron Jobs]
    end
    
    subgraph "Core Services"
        IMP[Import Service]
        EXP[Export Service]
        AGG[Aggregation Service]
        SEARCH[Search Service]
    end
    
    subgraph "Database"
        PG[(PostgreSQL)]
        CACHE[(Redis Cache)]
    end
    
    subgraph "Output"
        MD[Markdown Files]
        JSON[JSON Files]
        TXT[Text Files]
    end
    
    CC -->|writes| CS
    CS --> JSONL
    
    CLI --> IMP
    CLI --> EXP
    CLI --> AGG
    
    API --> IMP
    API --> EXP
    API --> SEARCH
    
    CRON --> AGG
    
    IMP -->|reads| JSONL
    IMP -->|stores| PG
    
    EXP -->|queries| PG
    EXP -->|writes| MD
    EXP -->|writes| JSON
    EXP -->|writes| TXT
    
    AGG -->|queries| PG
    AGG -->|caches| CACHE
    AGG -->|writes| MD
    
    SEARCH -->|queries| PG
    SEARCH -->|uses| CACHE
```

## 📋 Component Interactions

```mermaid
sequenceDiagram
    participant User
    participant CLI
    participant ImportUseCase
    participant FileSystem
    participant Database
    participant ExportUseCase
    participant OutputFiles

    User->>CLI: claude-prompts /project --full --both
    CLI->>ImportUseCase: Check if sessions exist in DB
    ImportUseCase->>Database: Query sessions
    
    alt Sessions not in DB
        ImportUseCase->>FileSystem: Read JSONL files
        FileSystem-->>ImportUseCase: Raw session data
        ImportUseCase->>Database: Store sessions/messages
    end
    
    CLI->>ExportUseCase: Export with options
    ExportUseCase->>Database: Fetch filtered messages
    Database-->>ExportUseCase: Messages
    ExportUseCase->>OutputFiles: Generate MD/JSON/TXT
    OutputFiles-->>User: Export complete
```

## 🔄 Import Flow

```mermaid
flowchart LR
    subgraph "1. Discovery"
        FIND[Find Claude Home]
        ENCODE[Encode Project Path]
        SCAN[Scan JSONL Files]
    end
    
    subgraph "2. Parsing"
        READ[Read JSONL]
        PARSE[Parse Messages]
        EXTRACT[Extract Content]
    end
    
    subgraph "3. Domain"
        CREATE[Create Entities]
        VALIDATE[Validate Data]
        ENRICH[Enrich Metadata]
    end
    
    subgraph "4. Persistence"
        UPSERT[Upsert Project]
        SAVE[Save Session]
        BULK[Bulk Insert Messages]
    end
    
    FIND --> ENCODE --> SCAN
    SCAN --> READ --> PARSE --> EXTRACT
    EXTRACT --> CREATE --> VALIDATE --> ENRICH
    ENRICH --> UPSERT --> SAVE --> BULK
```

## 🚀 Deployment Architecture

```mermaid
graph TB
    subgraph "User Machine"
        NPM[npm/yarn]
        GLOBAL[Global Install]
        LOCAL[Project Install]
    end
    
    subgraph "Execution Modes"
        STANDALONE[Standalone CLI]
        SERVER[API Server]
        WORKER[Background Worker]
    end
    
    subgraph "Data Sources"
        FS[File System]
        DB[(PostgreSQL)]
        REDIS[(Redis)]
    end
    
    NPM --> GLOBAL
    NPM --> LOCAL
    
    GLOBAL --> STANDALONE
    LOCAL --> STANDALONE
    LOCAL --> SERVER
    LOCAL --> WORKER
    
    STANDALONE -->|direct| FS
    STANDALONE -->|optional| DB
    
    SERVER --> DB
    SERVER --> REDIS
    
    WORKER --> DB
    WORKER --> REDIS
```

## 📊 Data Pipeline

```mermaid
graph LR
    subgraph "Input"
        CLAUDE[Claude Sessions]
        API_IN[API Upload]
        MANUAL[Manual Import]
    end
    
    subgraph "Processing"
        PARSE[Parse & Validate]
        TRANS[Transform]
        FILTER[Filter]
        AGG[Aggregate]
    end
    
    subgraph "Storage"
        HOT[(Hot Data<br/>PostgreSQL)]
        WARM[(Warm Data<br/>Redis Cache)]
        COLD[(Cold Data<br/>S3/Archive)]
    end
    
    subgraph "Output"
        EXPORT[Export Service]
        SEARCH[Search API]
        STATS[Analytics]
    end
    
    CLAUDE --> PARSE
    API_IN --> PARSE
    MANUAL --> PARSE
    
    PARSE --> TRANS
    TRANS --> FILTER
    FILTER --> HOT
    
    HOT --> AGG
    AGG --> WARM
    
    HOT --> EXPORT
    WARM --> SEARCH
    HOT --> STATS
    
    HOT -->|archive| COLD
```

## 🔒 Security Model

```mermaid
graph TB
    subgraph "Access Layer"
        CLI[CLI Access]
        API[API Access]
        WEB[Web Access]
    end
    
    subgraph "Auth Layer"
        LOCAL[Local File Auth]
        JWT[JWT Tokens]
        APIKEY[API Keys]
    end
    
    subgraph "Data Layer"
        RLS[Row Level Security]
        ENCRYPT[Encryption at Rest]
        AUDIT[Audit Logs]
    end
    
    CLI --> LOCAL
    API --> JWT
    API --> APIKEY
    WEB --> JWT
    
    LOCAL --> RLS
    JWT --> RLS
    APIKEY --> RLS
    
    RLS --> ENCRYPT
    RLS --> AUDIT
```

## 📈 Performance Optimization

```mermaid
graph LR
    subgraph "Caching Strategy"
        L1[L1: In-Memory]
        L2[L2: Redis]
        L3[L3: Database]
    end
    
    subgraph "Query Optimization"
        INDEX[Indexes]
        MVIEW[Materialized Views]
        PART[Partitioning]
    end
    
    subgraph "Export Optimization"
        STREAM[Streaming]
        BATCH[Batch Processing]
        ASYNC[Async Jobs]
    end
    
    L1 -->|miss| L2
    L2 -->|miss| L3
    
    L3 --> INDEX
    L3 --> MVIEW
    L3 --> PART
    
    MVIEW --> STREAM
    INDEX --> BATCH
    PART --> ASYNC
```

## 🎮 State Management

```mermaid
stateDiagram-v2
    [*] --> Idle
    
    Idle --> Importing: Import Command
    Importing --> Processing: Files Found
    Processing --> Validating: Parse Success
    Validating --> Persisting: Valid Data
    Persisting --> Indexed: Save Success
    
    Indexed --> Exporting: Export Command
    Exporting --> Generating: Query Success
    Generating --> Complete: Files Written
    
    Complete --> Idle
    
    Importing --> Failed: No Files
    Processing --> Failed: Parse Error
    Validating --> Failed: Invalid Data
    Persisting --> Failed: DB Error
    Exporting --> Failed: Query Error
    Generating --> Failed: Write Error
    
    Failed --> Idle: Retry/Cancel
```

## 🔧 Configuration Flow

```mermaid
graph TD
    subgraph "Configuration Sources"
        ENV[Environment Variables]
        FILE[.env File]
        CLI_ARGS[CLI Arguments]
        DEFAULTS[Default Values]
    end
    
    subgraph "Configuration Manager"
        LOADER[Config Loader]
        VALIDATOR[Validator]
        MERGER[Merger]
    end
    
    subgraph "Application"
        RUNTIME[Runtime Config]
        SERVICES[Services]
    end
    
    DEFAULTS --> MERGER
    FILE --> LOADER
    ENV --> LOADER
    CLI_ARGS --> LOADER
    
    LOADER --> VALIDATOR
    VALIDATOR --> MERGER
    MERGER --> RUNTIME
    RUNTIME --> SERVICES
```