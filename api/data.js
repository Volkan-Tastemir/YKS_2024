import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, 'data.json');

let data = [];
try {
  data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`Loaded ${data.length} records`);
} catch (err) {
  console.error('Error loading data:', err.message);
  process.exit(1);
}

function aggregateBySchool(schoolName, filterYeni, filterEski) {
  const filtered = data.filter(d => d.school_name === schoolName);
  
  const agg = {};
  for (const v of filtered) {
    const key = `${v.university_name}|${v.name_of_field}`;
    if (!agg[key]) {
      agg[key] = {
        university: v.university_name,
        bolum: v.name_of_field,
        yeni_mezun: 0,
        eski_mezun: 0
      };
    }
    
    if (filterYeni) agg[key].yeni_mezun += v.ilk_kazanan;
    if (filterEski) agg[key].eski_mezun += v.sonraki_kazanan;
  }
  
  const results = Object.values(agg).map(v => ({
    ...v,
    toplam: v.yeni_mezun + v.eski_mezun
  })).filter(v => v.toplam > 0).sort((a, b) => b.toplam - a.toplam);
  
  return results;
}

function searchSchools(query) {
  if (!query) return [];
  const q = query.toLowerCase();
  const schools = new Set();
  
  for (const item of data) {
    if (item.school_name.toLowerCase().includes(q)) {
      schools.add(item.school_name);
      if (schools.size >= 20) break;
    }
  }
  
  return Array.from(schools);
}

export { data, aggregateBySchool, searchSchools };