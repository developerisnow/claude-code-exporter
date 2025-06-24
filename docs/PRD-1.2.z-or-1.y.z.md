# Feedback by Examples
## Current result
```bash
hypetrain-garden (fix/elastic) ❯ claude-prompts ./ --full                6:31:55
Claude Session Exporter (Full Conversations)

Project: /Users/user/__Repositories/HypeTrain/repositories/hypetrain-garden

Multiple Claude home directories found:
1) /Users/user/.claude
2) /Users/user/.config/claude

Which would you like to use? [1-2]: 2
Using: /Users/user/.config/claude

Output:  /Users/user/__Repositories/HypeTrain/repositories/hypetrain-garden/claude-prompts

✓ 2d002199-ca50-464e-ab59-d2165df9e248: 143 messages
✓ 2d09d5d7-c929-47af-ba41-b69cb78127d0: 956 messages
✓ 33c13f1c-928d-4128-86a2-28b241f47949: 177 messages
✓ 553b2e35-8d67-4d02-b4a4-ce8c64997f90: 48 messages
✓ 73d2983f-16f9-4267-9611-3b55f790562e: 235 messages
✓ 774582c7-17e7-4dbc-96d6-3aac481aaf0c: 534 messages
✓ 9c3d77da-dd3c-45cf-acae-b5c26ba1a4ce: 6 messages
✓ b8abbeb7-e092-4631-90ae-71713e9d1cd2: 475 messages
✓ c3a3958c-74de-4fae-b132-10bfa108098e: 5 messages
✓ e9b13fba-5e39-4da1-9a5a-214ea78f9fe1: 1 messages
✓ f7c99fad-e608-4c62-bdaa-b6a85761b531: 162 messages

Exported 11 sessions (2742 total messages) to /Users/user/__Repositories/HypeTrain/repositories/hypetrain-garden/claude-prompts/

hypetrain-garden (fix/elastic) ❯ tree claude-prompts
claude-prompts
├── 2d002199-ca50-464e-ab59-d2165df9e248-untitled-full.md
├── 2d09d5d7-c929-47af-ba41-b69cb78127d0-drop-it-honestly-real-actually-full.md
├── 33c13f1c-928d-4128-86a2-28b241f47949-untitled-full.md
├── 553b2e35-8d67-4d02-b4a4-ce8c64997f90-read-users-user-repositories-hypetrain-full.md
├── 73d2983f-16f9-4267-9611-3b55f790562e-untitled-full.md
├── 774582c7-17e7-4dbc-96d6-3aac481aaf0c-untitled-full.md
├── 9c3d77da-dd3c-45cf-acae-b5c26ba1a4ce-this-session-is-being-continued-full.md
├── b8abbeb7-e092-4631-90ae-71713e9d1cd2-untitled-full.md
├── c3a3958c-74de-4fae-b132-10bfa108098e-read-users-user-repositories-hypetrain-full.md
├── e9b13fba-5e39-4da1-9a5a-214ea78f9fe1-caveat-the-messages-below-were-full.md
└── f7c99fad-e608-4c62-bdaa-b6a85761b531-untitled-full.md

0 directories, 11 files
hypetrain-garden (fix/elastic) ❯ 
```

## Desired result

```bash
hypetrain-garden (fix/elastic) ❯ claude-prompts ./ --full                6:31:55
Claude Session Exporter (Full Conversations)

Project: /Users/user/__Repositories/HypeTrain/repositories/hypetrain-garden

Multiple Claude home directories found:
1) /Users/user/.claude
2) /Users/user/.config/claude
Defaulting to: 1) /Users/user/.config/claude
Which would you like to use? [1-2]: 2
Using: /Users/user/.config/claude


Choose a mode:
1) Prompts Only
2) Outputs Only
3) Both: Prompts and Outputs
What do you want to export?[1-3]: 3
Defaulting to: 1) Prompts Only
Using: 3) Both: Prompts and Outputs


Choose a format:
1) Markdown
2) JSON
3) Both: Markdown and JSON
Defaulting to: 1) Markdown
What do you want to export?[1-3]: 3
Using: 3) Both: Markdown and JSON

Output:  /Users/user/__Repositories/HypeTrain/repositories/hypetrain-garden/claude-prompts

✓ 2d002199-ca50-464e-ab59-d2165df9e248: 143 messages (56 user, 87 assistant) last 2025-06-23, 17:27:48
...
Exported 11 sessions (2742 total messages) to /Users/user/__Repositories/HypeTrain/repositories/hypetrain-garden/claude-prompts/

hypetrain-garden (fix/elastic) ❯ tree claude-prompts
claude-prompts
node_modules
└── readline-sync
    ├── lib
└── readline-sync
    ├── lib
    │   ├── encrypt.js
├── 20250623-172748-untitled/
    ├── prompts-20250623-172748-untitled-2d002199-ca50-464e-ab59-d2165df9e248.md
    ├── outputs-20250623-172748-untitled-2d002199-ca50-464e-ab59-d2165df9e248.md
    ├── full-output-20250623-172748-untitled-2d002199-ca50-464e-ab59-d2165df9e248.md
    ├── prompts-20250623-172748-untitled-2d002199-ca50-464e-ab59-d2165df9e248.json
    ├── outputs-20250623-172748-untitled-2d002199-ca50-464e-ab59-d2165df9e248.json
    ├── full-output-20250623-172748-untitled-2d002199-ca50-464e-ab59-d2165df9e248.json
├── 2d002199-ca50-464e-ab59-d2165df9e248-untitled-full.md
├── 2d09d5d7-c929-47af-ba41-b69cb78127d0-drop-it-honestly-real-actually-full.md
├── 33c13f1c-928d-4128-86a2-28b241f47949-untitled-full.md
├── 553b2e35-8d67-4d02-b4a4-ce8c64997f90-read-users-user-repositories-hypetrain-full.md
├── 73d2983f-16f9-4267-9611-3b55f790562e-untitled-full.md
├── 774582c7-17e7-4dbc-96d6-3aac481aaf0c-untitled-full.md
├── 9c3d77da-dd3c-45cf-acae-b5c26ba1a4ce-this-session-is-being-continued-full.md
├── b8abbeb7-e092-4631-90ae-71713e9d1cd2-untitled-full.md
├── c3a3958c-74de-4fae-b132-10bfa108098e-read-users-user-repositories-hypetrain-full.md
├── e9b13fba-5e39-4da1-9a5a-214ea78f9fe1-caveat-the-messages-below-were-full.md
└── f7c99fad-e608-4c62-bdaa-b6a85761b531-untitled-full.md
```