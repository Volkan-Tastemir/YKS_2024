import {openDb, fetchAll, close} from './sql.js';

(async () => {
  const db = await openDb();
  
  // Get all data for this school
  const rows = await fetchAll(db, 
    'SELECT university_name, name_of_field, new_graduated, early_graduated FROM highschools WHERE school_name = ?', 
    ['GÜLİZAR ZEKİ OBDAN ANADOLU LİSESİ (İSTANBUL - PENDİK)']);
  
  console.log('Total records for school:', rows.length);
  
  // Group by university (same as API does)
  const grouped = await fetchAll(db,
    `SELECT university_name, name_of_field, 
      SUM(new_graduated) as yeni_mezun, 
      SUM(early_graduated) as eski_mezun
     FROM highschools 
     WHERE school_name = ? 
     GROUP BY university_name, name_of_field`,
    ['GÜLİZAR ZEKİ OBDAN ANADOLU LİSESİ (İSTANBUL - PENDİK)']);
  
  console.log('Grouped results:', JSON.stringify(grouped.slice(0, 10), null, 2));
  
  // Check if Istanbul Medeniyet exists
  const medeniyet = grouped.filter(r => r.university_name.includes('MEDENİYET'));
  console.log('Medeniyet records:', JSON.stringify(medeniyet, null, 2));
  
  await close(db);
})();
