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

async function getAllCursorProjects() {
  console.log('🔍 Finding all Cursor projects...\n');
  
  try {
    // Get all .specstory directories
    const findCommand = `find /Users/user/__Repositories -type d -name ".specstory" -maxdepth 8 2>/dev/null`;
    const result = execSync(findCommand, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 });
    
    const projects = result
      .split('\n')
      .filter(line => line.trim())
      .map(specPath => path.dirname(specPath))
      .filter(p => !p.endsWith('/.specstory')); // Remove duplicate .specstory itself
    
    return [...new Set(projects)]; // Remove duplicates
  } catch (error) {
    console.error('Error finding projects:', error.message);
    return [];
  }
}

async function importProject(projectPath, providerId) {
  const specStoryPath = path.join(projectPath, '.specstory', 'history');
  
  if (!fs.existsSync(specStoryPath)) {
    return { conversations: 0, turns: 0, skipped: true };
  }
  
  const stats = { conversations: 0, turns: 0, skipped: false };
  
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
    
    // Get conversation files
    const files = fs.readdirSync(specStoryPath)
      .filter(f => f.endsWith('.md'))
      .slice(0, 50); // Limit to 50 files per project for now
    
    for (const file of files) {
      try {
        const filePath = path.join(specStoryPath, file);
        const fileStats = fs.statSync(filePath);
        
        // Skip very large files
        if (fileStats.size > 5 * 1024 * 1024) continue;
        
        // Check if already imported
        const existing = await client.query(
          'SELECT id FROM conversations WHERE filename = $1',
          [file]
        );
        
        if (existing.rows.length > 0) continue;
        
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Parse filename
        const match = file.match(/^(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2})/);
        let conversationDate = new Date();
        
        if (match) {
          const [, date, time] = match;
          conversationDate = new Date(`${date}T${time.replace('-', ':')}:00`);
        }
        
        // Save conversation
        await client.query(`
          INSERT INTO conversations (
            id, project_id, filename, title, 
            conversation_date, is_summary
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5
          )
        `, [projectId, file, file.substring(0, 100), conversationDate, false]);
        
        stats.conversations++;
        
        // Simple turn count (just count User/Assistant markers)
        const userCount = (content.match(/_\*\*User\*\*_/g) || []).length;
        const assistantCount = (content.match(/_\*\*Assistant\*\*_/g) || []).length;
        stats.turns += userCount + assistantCount;
        
      } catch (err) {
        // Skip file errors
      }
    }
    
  } catch (error) {
    console.error(`Error importing ${projectPath}:`, error.message);
  }
  
  return stats;
}

async function main() {
  await client.connect();
  
  try {
    console.log('🚀 Starting Cursor batch import...\n');
    
    // Get Cursor provider
    const providerResult = await client.query(
      "SELECT id FROM providers WHERE name = 'cursor'"
    );
    const providerId = providerResult.rows[0].id;
    
    // Get all projects
    const projects = await getAllCursorProjects();
    console.log(`Found ${projects.length} Cursor projects\n`);
    
    let totalProjects = 0;
    let totalConversations = 0;
    let totalTurns = 0;
    
    // Process in batches
    for (let i = 0; i < projects.length; i++) {
      const projectPath = projects[i];
      process.stdout.write(`[${i+1}/${projects.length}] ${projectPath.substring(projectPath.lastIndexOf('/') + 1)}... `);
      
      const stats = await importProject(projectPath, providerId);
      
      if (stats.skipped) {
        console.log('no .specstory');
      } else if (stats.conversations === 0) {
        console.log('no new conversations');
      } else {
        console.log(`✅ ${stats.conversations} conversations`);
        totalProjects++;
        totalConversations += stats.conversations;
        totalTurns += stats.turns;
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 IMPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Projects with data: ${totalProjects}`);
    console.log(`Conversations imported: ${totalConversations}`);
    console.log(`Estimated turns: ${totalTurns}`);
    
    // Database totals
    const dbStats = await client.query(`
      SELECT 
        COUNT(DISTINCT p.id) as projects,
        COUNT(DISTINCT c.id) as conversations
      FROM projects p
      LEFT JOIN conversations c ON p.id = c.project_id
      WHERE p.provider_id = $1
    `, [providerId]);
    
    console.log('\n📈 DATABASE TOTALS:');
    console.log(`Total Cursor projects: ${dbStats.rows[0].projects}`);
    console.log(`Total conversations: ${dbStats.rows[0].conversations}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await client.end();
  }
}

main().catch(console.error);