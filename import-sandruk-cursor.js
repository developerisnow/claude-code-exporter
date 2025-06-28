#!/usr/bin/env node
require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'dev',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'claude_exporter',
  port: process.env.DB_PORT || 5432,
});

const sandrukProjects = [
  '/Users/user/____Sandruk/___PARA/__Resources/_SystemDesign_Algorithms',
  '/Users/user/____Sandruk/___PARA/__Projects/_Backlog/Nodes-DePin-Crypto_2024Q4',
  '/Users/user/____Sandruk/___PARA/__Areas/_5_CAREER/course-hello-new-job-kak-i-gde-naiti-rabotu-v-2024-godu-2-0',
  '/Users/user/____Sandruk/___PARA/__Areas/_5_CAREER/DEVOPS',
  '/Users/user/____Sandruk/___PARA/__Areas/_5_CAREER/Career-Oleksandr-Aleksandruk-2024-Q3',
  '/Users/user/____Sandruk/___PARA/__Areas/__7.2.SYSTEM-GROWTH-SECOND-BRAIN',
  '/Users/user/____Sandruk/___PARA/__Areas/__6.ENTREPRENEURSHIP-STARTUP-BUSINESS/useai.pro',
  '/Users/user/____Sandruk/___PARA/__Areas/__6.ENTREPRENEURSHIP-STARTUP-BUSINESS/useai.pro/shadcn-landing-page',
  '/Users/user/____Sandruk/___PKM/__SecondBrain/Projects_PKM/dolls-robo-ai',
  '/Users/user/____Sandruk/___PKM/__SecondBrain/Projects_PKM/Career-Oleksandr-Aleksandruk/Career-Oleksandr-Aleksandruk-2024-Q3',
  '/Users/user/____Sandruk/___PKM/__SecondBrain/Projects_PKM/Career-Oleksandr-Aleksandruk',
  '/Users/user/____Sandruk/___PKM/__SecondBrain/Projects_PKM/Assistant-Telegram',
  '/Users/user/____Sandruk/___PKM',
  '/Users/user/____Sandruk/___PKM/.obsidian/plugins/obsidian-toggl-integration'
];

async function importProject(projectPath, providerId) {
  const specStoryPath = path.join(projectPath, '.specstory', 'history');
  
  if (!fs.existsSync(specStoryPath)) {
    return { conversations: 0, skipped: true };
  }
  
  const stats = { conversations: 0, skipped: false };
  
  try {
    // Create or update project
    const projectName = path.basename(projectPath) || 'PKM';
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
      .filter(f => f.endsWith('.md'));
    
    console.log(`  Found ${files.length} conversation files`);
    
    for (const file of files) {
      try {
        const filePath = path.join(specStoryPath, file);
        const fileStats = fs.statSync(filePath);
        
        // Skip very large files
        if (fileStats.size > 10 * 1024 * 1024) {
          console.log(`  Skipping large file: ${file}`);
          continue;
        }
        
        // Check if already imported
        const existing = await client.query(
          'SELECT id FROM conversations WHERE filename = $1',
          [file]
        );
        
        if (existing.rows.length > 0) continue;
        
        // Parse filename for date
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
        `, [projectId, file, file.substring(0, 200), conversationDate, false]);
        
        stats.conversations++;
        
      } catch (err) {
        console.log(`  Error with file ${file}: ${err.message}`);
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
    console.log('🚀 Importing Sandruk Cursor projects...\n');
    
    // Get Cursor provider
    const providerResult = await client.query(
      "SELECT id FROM providers WHERE name = 'cursor'"
    );
    const providerId = providerResult.rows[0].id;
    
    let totalProjects = 0;
    let totalConversations = 0;
    
    // Process each project
    for (let i = 0; i < sandrukProjects.length; i++) {
      const projectPath = sandrukProjects[i];
      console.log(`\n[${i+1}/${sandrukProjects.length}] ${projectPath}`);
      
      const stats = await importProject(projectPath, providerId);
      
      if (stats.skipped) {
        console.log('  No .specstory directory');
      } else if (stats.conversations === 0) {
        console.log('  No new conversations');
      } else {
        console.log(`  ✅ Imported ${stats.conversations} conversations`);
        totalProjects++;
        totalConversations += stats.conversations;
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 IMPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Projects with data: ${totalProjects}`);
    console.log(`Conversations imported: ${totalConversations}`);
    
    // Database totals
    const dbStats = await client.query(`
      SELECT 
        COUNT(DISTINCT p.id) as projects,
        COUNT(DISTINCT c.id) as conversations
      FROM projects p
      LEFT JOIN conversations c ON p.id = c.project_id
      WHERE p.provider_id = $1
    `, [providerId]);
    
    console.log('\n📈 DATABASE TOTALS FOR CURSOR:');
    console.log(`Total projects: ${dbStats.rows[0].projects}`);
    console.log(`Total conversations: ${dbStats.rows[0].conversations}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await client.end();
  }
}

main().catch(console.error);