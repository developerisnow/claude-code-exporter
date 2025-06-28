# Period-Based Aggregation Design

## Requirements

### 1. --period Flag
- Filter sessions by time period: `--period=1d` (last 1 day), `--period=2w` (last 2 weeks), etc.
- Supported units: d (days), w (weeks), m (months), y (years)
- Number prefix: 1d, 7d, 2w, 3m, 1y

### 2. --periodGroup Flag  
- Group output by time periods
- Valid groupings (hierarchical):
  - `d` (days) - can be used with any period
  - `w` (weeks) - can be used with period >= 1w
  - `m` (months) - can be used with period >= 1m
  - `y` (years) - can be used with period >= 1y
- Invalid: Can't group by weeks if period is days, etc.

### 3. Output Structure

#### Flat aggregate with period grouping:
```
aggregated-prompts/
├── aggregated-20250628-163000-20250627-Dd.md  # Day group
├── aggregated-20250628-163000-20250626-Dd.md
└── aggregated-20250628-163000-20250625-Dd.md
```

#### Nested aggregate with period grouping:
```
aggregated-prompts/
├── 20250628-Dd/  # Instead of project name
│   └── {session-folders}/
│       └── {files}
├── 20250627-Dd/
│   └── {session-folders}/
└── 20250626-Dd/
    └── {session-folders}/
```

### 4. Grouping Formats
- Day: `{yyyymmdd}-Dd` (e.g., 20250628-Dd)
- Week: `{yyyy}-W{ww}` (e.g., 2025-W26)  
- Month: `{yyyy}-{mm}M` (e.g., 2025-06M)
- Year: `{yyyy}Y` (e.g., 2025Y)

## Implementation Plan

1. Parse period flag to calculate date range
2. Filter sessions by timestamp within range
3. Group sessions by periodGroup if specified
4. Create appropriate folder structure
5. Generate aggregated files per group

## Examples

```bash
# Last 7 days, grouped by day
claude-prompts --aggregate --period=7d --periodGroup=d

# Last 3 months, grouped by week
claude-prompts --aggregate --period=3m --periodGroup=w

# Last year, grouped by month
claude-prompts --aggregate --period=1y --periodGroup=m

# With nested structure
claude-prompts --aggregate --nested --period=1w --periodGroup=d
```