import {openDb, fetchAll, close} from './sql.js';
(async () => {
  const db = await openDb();
  const r = await fetchAll(db, 'SELECT * FROM highschools WHERE school_name LIKE ? LIMIT 5', ['%ÜSKÜDAR%']);
  console.log('Rows:', JSON.stringify(r, null, 2));
  await close(db);
})();