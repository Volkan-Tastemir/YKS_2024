import express from 'express';
import cors from 'cors';
import { openDb, fetchAll, close } from './sql.js';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
}

const PORT = process.env.PORT || 3002;

app.get('/api/okullar', async (req, res) => {
  const { aranan } = req.query;

  if (!aranan || aranan.length < 2) {
    res.json({ okullar: [] });
    return;
  }

  let db;
  try {
    db = await openDb();

    const sql = `
      SELECT DISTINCT school_name
      FROM highschools
      WHERE school_name LIKE ?
      LIMIT 20
    `;

    const rows = await fetchAll(db, sql, [`%${aranan}%`]);
    const okullar = rows.map(r => r.school_name);
    res.json({ okullar });
  } catch (err) {
    console.error('Query error:', err);
    res.status(500).json({ error: 'Database query failed' });
  } finally {
    if (db) await close(db);
  }
});

app.get('/api/tum-okullar', async (req, res) => {
  let db;
  try {
    db = await openDb();
    const rows = await fetchAll(db, 'SELECT DISTINCT school_name FROM highschools ORDER BY school_name');
    res.json(rows.map(r => r.school_name));
  } catch (err) {
    console.error('Query error:', err);
    res.status(500).json({ error: 'Database query failed' });
  } finally {
    if (db) await close(db);
  }
});

app.get('/api/okul/:okulAdi', async (req, res) => {
  let okulAdi = decodeURIComponent(req.params.okulAdi);
  const { filter_yeni, filter_eski } = req.query;

  console.log('Requested school (decoded):', okulAdi);

  const filterYeni = filter_yeni === 'true';
  const filterEski = filter_eski === 'true';

  if (!filterYeni && !filterEski) {
    res.json({
      okul_adi: okulAdi,
      istatistik: { toplam_ogrenci: 0, universite_sayisi: 0, bolum_sayisi: 0 },
      sonuclar: []
    });
    return;
  }

  let db;
  try {
    db = await openDb();

    const checkSql = `SELECT COUNT(*) as count FROM highschools WHERE school_name = ?`;
    const checkResult = await fetchAll(db, checkSql, [okulAdi]);
    console.log('School count:', checkResult[0].count);

    const sql = `
      SELECT university_name, name_of_field,
        SUM(new_graduated) as yeni_mezun,
        SUM(early_graduated) as eski_mezun
      FROM highschools
      WHERE school_name = ?
      GROUP BY university_name, name_of_field
    `;

    const rows = await fetchAll(db, sql, [okulAdi]);
    console.log('Query results:', rows.length);

    const results = rows.map(r => ({
      university: r.university_name,
      bolum: r.name_of_field,
      yeni_mezun: r.yeni_mezun || 0,
      eski_mezun: r.eski_mezun || 0,
      toplam: (r.yeni_mezun || 0) + (r.eski_mezun || 0)
    })).filter(r => {
      if (!filterYeni && filterEski) return r.eski_mezun > 0;
      if (filterYeni && !filterEski) return r.yeni_mezun > 0;
      return r.toplam > 0;
    }).sort((a, b) => b.toplam - a.toplam);

    const totalStudents = results.reduce((sum, r) => sum + r.toplam, 0);
    const uniqueUniversities = new Set(results.map(r => r.university)).size;

    res.json({
      okul_adi: okulAdi,
      istatistik: {
        toplam_ogrenci: totalStudents,
        universite_sayisi: uniqueUniversities,
        bolum_sayisi: results.length
      },
      sonuclar: results.slice(0, 100)
    });
  } catch (err) {
    console.error('Query error for', okulAdi, ':', err);
    res.status(500).json({ error: 'Database query failed', details: err.message });
  } finally {
    if (db) await close(db);
  }
});

app.get('/api/health', async (req, res) => {
  let db;
  try {
    db = await openDb();
    const rows = await fetchAll(db, 'SELECT COUNT(*) as count FROM highschools');
    res.json({ status: 'ok', records: rows[0].count });
  } catch (err) {
    res.json({ status: 'error', records: 0 });
  } finally {
    if (db) await close(db);
  }
});

app.get('*', (req, res) => {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  const indexPath = path.join(clientDist, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Client build not found');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
