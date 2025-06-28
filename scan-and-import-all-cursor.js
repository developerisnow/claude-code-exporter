#!/usr/bin/env node
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const client = new Client({
  host: 'localhost',
  user: 'dev',
  password: 'dev_4223',
  database: 'claude_exporter',
  port: 5432,
});

// Directories to skip for performance
const SKIP_DIRS = [
  'node_modules',
  '.git',
  'Library',
  'Applications',
  '.Trash',
  '.npm',
  '.cache',
  'venv',
  '__pycache__',
  'dist',
  'build',
  '.next',
  'coverage',
  'vendor'
];

async function findAllSpecStoryProjects() {
  console.log('🔍 Searching for all .specstory directories...\n');
  
  const searchPaths = [
    '/Users/user/__Repositories',
    '/Users/user/Documents',
    '/Users/user/Projects',
    '/Users/user/Code',
    '/Users/user/Desktop',
    '/Users/user/Downloads',
    '/Users/user/dev',
    '/Users/user/workspace'
  ];
  
  const allProjects = [];
  
  for (const searchPath of searchPaths) {
    if (!fs.existsSync(searchPath)) continue;
    
    try {
      console.log(`  Searching in ${searchPath}...`);
      const findCommand = `find "${searchPath}" -type d -name ".specstory" -maxdepth 8 2>/dev/null | head -500`;
      const result = execSync(findCommand, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 });
      
      const specStoryPaths = result
        .split('\n')
        .filter(line => line.trim())
        .map(specPath => path.dirname(specPath))
        .filter(projectPath => {
          // Additional filtering
          return !SKIP_DIRS.some(skip => projectPath.includes(`/${skip}/`));
        });
      
      allProjects.push(...specStoryPaths);
      console.log(`    Found ${specStoryPaths.length} projects`);
    } catch (error) {
      console.log(`    Error searching ${searchPath}: ${error.message}`);
    }
  }
  
  // Remove duplicates
  const uniqueProjects = [...new Set(allProjects)];
  console.log(`\nTotal unique projects found: ${uniqueProjects.length}\n`);
  return uniqueProjects;
}

async function importCursorProject(projectPath, providerId, stats) {
  const specStoryPath = path.join(projectPath, '.specstory', 'history');
  
  if (!fs.existsSync(specStoryPath)) {
    return;
  }
  
  console.log(`\n📂 Processing: ${projectPath}`);
  
  try {
    // Create or update project
    const projectName = path.basename(projectPath);
    const encodedPath = projectPath.replace(/\//g, '-').replace(/^-/, '');
    
    await client.query(`
      INSERT INTO projects (
        id, path, name, encoded_path, provider_id, 
        project_type, first_seen, last_updated
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, 
        'cursor', NOW(), NOW()
      )
      ON CONFLICT (path, provider_id) 
      DO UPDATE SET last_updated = NOW()
    `, [projectPath, projectName, encodedPath, providerId]);
    
    // Get project ID
    const projectResult = await client.query(
      'SELECT id FROM projects WHERE path = $1 AND provider_id = $2',
      [projectPath, providerId]
    );
    const projectId = projectResult.rows[0].id;
    
    // Import conversations
    const files = fs.readdirSync(specStoryPath)
      .filter(f => f.endsWith('.md'));
    
    let projectConversations = 0;
    let projectTurns = 0;
    
    for (const file of files) {
      const filePath = path.join(specStoryPath, file);
      const fileStats = fs.statSync(filePath);
      
      // Skip very large files (>10MB)
      if (fileStats.size > 10 * 1024 * 1024) {
        console.log(`  ⚠️  Skipping large file: ${file} (${(fileStats.size / 1024 / 1024).toFixed(2)}MB)`);
        continue;
      }
      
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Parse filename for date and title
      const match = file.match(/^(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2})-(.+)\.md$/);
      let conversationDate = new Date();
      let title = file.replace('.md', '');
      
      if (match) {
        const [, date, time, titlePart] = match;
        conversationDate = new Date(`${date}T${time.replace('-', ':')}:00`);
        title = titlePart.replace(/-/g, ' ');
      }
      
      // Extract title from content
      const titleMatch = content.match(/^#\s+(.+?)(?:\s+\(|$)/m);
      if (titleMatch) {
        title = titleMatch[1];
      }
      
      // Check if conversation already exists
      const existingConv = await client.query(
        'SELECT id, updated_at FROM conversations WHERE filename = $1',
        [file]
      );
      
      if (existingConv.rows.length > 0) {
        // Skip if file hasn't been modified
        if (existingConv.rows[0].updated_at >= fileStats.mtime) {
          stats.skipped++;
          continue;
        }
      }
      
      // Save conversation
      await client.query(`
        INSERT INTO conversations (
          id, project_id, filename, title, 
          conversation_date, is_summary
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5
        )
        ON CONFLICT (filename) 
        DO UPDATE SET 
          title = EXCLUDED.title,
          project_id = EXCLUDED.project_id,
          updated_at = NOW()
      `, [projectId, file, title, conversationDate, file.includes('summary')]);
      
      // Get conversation ID
      const convResult = await client.query(
        'SELECT id FROM conversations WHERE filename = $1',
        [file]
      );
      const conversationId = convResult.rows[0].id;
      
      // Parse and save turns
      const turns = parseConversationTurns(content);
      
      // Delete existing turns
      await client.query(
        'DELETE FROM conversation_turns WHERE conversation_id = $1',
        [conversationId]
      );
      
      // Insert new turns in batch
      if (turns.length > 0) {
        const values = [];
        const params = [];
        
        for (let i = 0; i < turns.length; i++) {
          const baseIdx = i * 5;
          values.push(`($${baseIdx + 1}, $${baseIdx + 2}, $${baseIdx + 3}, $${baseIdx + 4}, $${baseIdx + 5})`);
          params.push(
            'gen_random_uuid()',
            conversationId,
            i + 1,
            turns[i].role,
            turns[i].content
          );
        }
        
        if (values.length > 0) {
          await client.query(`
            INSERT INTO conversation_turns (id, conversation_id, turn_number, role, content)
            VALUES ${values.join(', ')}
          `, params);
        }
      }
      
      projectConversations++;
      projectTurns += turns.length;
      stats.totalTurns += turns.length;
    }
    
    if (projectConversations > 0) {
      console.log(`  ✅ Imported: ${projectConversations} conversations, ${projectTurns} turns`);
      stats.projects++;
      stats.conversations += projectConversations;
    } else {
      console.log(`  ⏭️  No new conversations`);
    }
    
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    stats.errors++;
  }
}

function parseConversationTurns(content) {
  const turns = [];
  
  // Remove header and metadata
  const conversationStart = content.indexOf('_**User**_');
  if (conversationStart === -1) {
    return turns;
  }
  
  const conversationContent = content.substring(conversationStart);
  
  // Split by turn markers
  const parts = conversationContent.split(/\n---\n/);
  
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    
    if (trimmed.startsWith('_**User**_')) {
      const content = trimmed.replace(/^_\*\*User\*\*_\n+/, '').trim();
      if (content) turns.push({ role: 'user', content });
    } else if (trimmed.startsWith('_**Assistant**_')) {
      const content = trimmed.replace(/^_\*\*Assistant\*\*_\n+/, '').trim();
      if (content) turns.push({ role: 'assistant', content });
    }
  }
  
  return turns;
}

async function main() {
  await client.connect();
  
  const stats = {
    projects: 0,
    conversations: 0,
    totalTurns: 0,
    skipped: 0,
    errors: 0
  };
  
  try {
    console.log('🚀 Starting system-wide Cursor import...\n');
    
    // Get Cursor provider
    const providerResult = await client.query(
      "SELECT id FROM providers WHERE name = 'cursor'"
    );
    const providerId = providerResult.rows[0].id;
    
    // Find all projects
    const projects = await findAllSpecStoryProjects();
    
    if (projects.length === 0) {
      console.log('No Cursor projects found.');
      return;
    }
    
    // Process each project
    for (const projectPath of projects) {
      await importCursorProject(projectPath, providerId, stats);
    }
    
    // Display summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 IMPORT SUMMARY');
    console.log('='.repeat(80));
    console.log(`Projects with new data: ${stats.projects}`);
    console.log(`Conversations imported: ${stats.conversations}`);
    console.log(`Total turns: ${stats.totalTurns}`);
    console.log(`Skipped (unchanged): ${stats.skipped}`);
    console.log(`Errors: ${stats.errors}`);
    
    // Show database totals
    const dbStats = await client.query(`
      SELECT 
        COUNT(DISTINCT p.id) as projects,
        COUNT(DISTINCT c.id) as conversations,
        COUNT(DISTINCT ct.id) as turns
      FROM projects p
      LEFT JOIN conversations c ON p.id = c.project_id
      LEFT JOIN conversation_turns ct ON c.id = ct.conversation_id
      WHERE p.provider_id = $1
    `, [providerId]);
    
    console.log('\n📈 DATABASE TOTALS FOR CURSOR:');
    console.log(`Total projects: ${dbStats.rows[0].projects}`);
    console.log(`Total conversations: ${dbStats.rows[0].conversations}`);
    console.log(`Total turns: ${dbStats.rows[0].turns}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await client.end();
  }
}

main().catch(console.error);