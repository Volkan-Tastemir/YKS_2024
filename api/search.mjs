import {openDb, fetchAll, close} from './sql.js';

(async () => {
  const db = await openDb();
  
  // Search for the school with various patterns
  const patterns = ['%Gülizar%', '%Obdan%', '%Zeki%', '%Gülizar Zeki%'];
  
  for (const pattern of patterns) {
    const rows = await fetchAll(db, 'SELECT DISTINCT school_name FROM highschools WHERE school_name LIKE ? LIMIT 10', [pattern]);
    console.log(`Pattern "${pattern}":`, JSON.stringify(rows, null, 2));
  }
  
  // Also check if school exists with different name
  const allSchools = await fetchAll(db, 'SELECT DISTINCT school_name FROM highschools WHERE school_name LIKE ? OR school_name LIKE ? OR school_name LIKE ?', ['%Gülizar%', '%Obdan%', '%Zeki Obdan%']);
  console.log('All matches:', JSON.stringify(allSchools, null, 2));
  
  await close(db);
})();
