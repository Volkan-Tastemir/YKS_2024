import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, 'data.json');
const dbPath = path.join(__dirname, 'yks.db');

async function initDb() {
  const db = new sqlite3.Database(dbPath);
  
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS highschools (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        school_name TEXT,
        university_name TEXT,
        name_of_field TEXT,
        ilk_kazanan INTEGER DEFAULT 0,
        sonraki_kazanan INTEGER DEFAULT 0
      )
    `);
    
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`Loading ${data.length} records...`);
    
    const stmt = db.prepare(`
      INSERT INTO highschools (school_name, university_name, name_of_field, ilk_kazanan, sonraki_kazanan)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    for (const row of data) {
      stmt.run(row.school_name, row.university_name, row.name_of_field, row.ilk_kazanan, row.sonraki_kazanan);
    }
    
    stmt.finalize();
    console.log('Database created successfully!');
  });
  
  db.close();
}

initDb().catch(console.error);