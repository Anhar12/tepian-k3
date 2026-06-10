import { db } from './src/client';
import fs from 'fs';
import path from 'path';
import { sql } from 'drizzle-orm';

async function run() {
  try {
    const file = fs.readFileSync(path.join(process.cwd(), 'src/migrations/0007_slimy_makkari.sql'), 'utf-8');
    
    // Split by statement-breakpoint
    const statements = file.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s.length > 0);
    
    console.log(`Running ${statements.length} statements...`);
    
    for (const statement of statements) {
      await db.execute(sql.raw(statement));
    }
    
    console.log('Migration 0006 executed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to execute migration:', err);
    process.exit(1);
  }
}

run();
