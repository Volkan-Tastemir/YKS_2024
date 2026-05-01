import {openDb, fetchAll, close} from './sql. js';
(async () => {
  const db = await openDb();
  const obdan = await fetchAll( db, 'SELECT DISTINCT school_ name FROM highschools WHERE school_ name LIKE ?', ['%Obdan%']);
  console. log('Obdan:', JSON. stringify(obdan, null, 2));
  const zeki = await fetchAll( db, 'SELECT DISTINCT school_ name FROM highschools WHERE school_ name LIKE ?', ['%Zeki%']);
  console. log('Zeki:', JSON. stringify(zeki, null, 2));
  await close( db);
})();