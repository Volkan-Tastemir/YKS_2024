import express from 'express';
import cors from 'cors';
import { data, aggregateBySchool, searchSchools } from './data.js';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3002;

app.get('/api/okullar', (req, res) => {
  const { aranan } = req.query;
  const results = searchSchools(aranan || '');
  res.json({ okullar: results });
});

app.get('/api/okul/:okulAdi', (req, res) => {
  const okulAdi = decodeURIComponent(req.params.okulAdi);
  const { filter_yeni, filter_eski } = req.query;
  
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
  
  const results = aggregateBySchool(okulAdi, filterYeni, filterEski);
  
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
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', records: data.length });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});