import { useState, useEffect, useCallback, useMemo } from 'react'
import Fuse from 'fuse.js';

interface OkulVeri {
  university: string
  bolum: string
  yeni_mezun: number
  eski_mezun: number
  toplam: number
}

interface ApiSonuc {
  okul_adi: string
  istatistik: {
    toplam_ogrenci: number
    universite_sayisi: number
    bolum_sayisi: number
  }
  sonuclar: OkulVeri[]
}

function App() {
  const [arama, setArama] = useState('')
  const [okullar, setOkullar] = useState<string[]>([])
  const [tumOkullar, setTumOkullar] = useState<string[]>([])
  const [seciliOkul, setSeciliOkul] = useState<string | null>(null)
  const [veri, setVeri] = useState<ApiSonuc | null>(null)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [filtreYeni, setFiltreYeni] = useState(true)
  const [filtreEski, setFiltreEski] = useState(true)

  const fuse = useMemo(() => new Fuse(tumOkullar, { threshold: 0.3 }), [tumOkullar]);

  useEffect(() => {
    fetch('/api/tum-okullar')
      .then(res => res.json())
      .then(data => setTumOkullar(data))
      .catch(err => console.error('Okul listesi yüklenemedi:', err));
  }, []);

  const okulAra = useCallback(async (query: string) => {
    if (query.length < 2) {
      setOkullar([])
      return
    }
    const results = fuse.search(query).slice(0, 20).map(r => r.item)
    setOkullar(results)
  }, [fuse])

  useEffect(() => {
    const timeout = setTimeout(() => okulAra(arama), 300)
    if (arama !== seciliOkul) {
      setSeciliOkul(null)
    }
    return () => clearTimeout(timeout)
  }, [arama, okulAra])

const okulSec = async (okulAdi: string) => {
    setSeciliOkul(okulAdi)
    setArama(okulAdi)
    setOkullar([])
    setYukleniyor(true)
    setHata(null)
    setVeri(null)

    try {
      const params = new URLSearchParams({
        filter_yeni: String(filtreYeni),
        filter_eski: String(filtreEski)
      })
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const res = await fetch(`/api/okul/${encodeURIComponent(okulAdi)}?${params}`, {
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      
      if (!res.ok) throw new Error('Veri bulunamadı')
      const data = await res.json()
      setVeri(data)
    } catch (e: any) {
      if (e.name === 'AbortError') {
        setHata('İstek zaman aşımına uğradı')
      } else {
        setHata('Okul bulunamadı veya veri yok')
      }
      setVeri(null)
} finally {
      setYukleniyor(false)
    }
  }

  const filtreleriGuncelle = async () => {
    const okul = seciliOkul
    if (!okul) return
    
    setYukleniyor(true)
    
    try {
      const params = new URLSearchParams({
        filter_yeni: String(filtreYeni),
        filter_eski: String(filtreEski)
      })
      const url = `/api/okul/${encodeURIComponent(okul)}?${params}`
      const res = await fetch(url)
      const data = await res.json()
      setVeri(data)
    } catch (e) {
      setHata('Veri yüklenirken hata oluştu')
      setVeri(null)
    } finally {
      setYukleniyor(false)
    }
  }

  useEffect(() => {
    if (seciliOkul) {
      if (!filtreYeni && !filtreEski) {
        setVeri(null)
      } else {
        setHata(null)
        filtreleriGuncelle()
      }
    }
  }, [seciliOkul, filtreYeni, filtreEski])

  const hataGoster = (!filtreYeni && !filtreEski) ? 'En az bir mezun türü seçilmeli' : hata 

  return (
    <div style={{ minHeight: '100vh', padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' }}>
          YKS 2024 - Üniversite Tercih Analizi
        </h1>
        <p style={{ color: '#94a3b8' }}>Liseden mezun olan öğrencilerin üniversite bölüm dağılımı</p>
      </header>

      <div style={{ marginBottom: '32px' }}>
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <input
            type="text"
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            placeholder="Lise adı giriniz..."
            style={{
              width: '100%',
              padding: '16px 20px',
              fontSize: '1.1rem',
              borderRadius: '12px',
              border: '2px solid #334155',
              backgroundColor: '#1e293b',
              color: '#f1f5f9'
            }}
          />
          {okullar.length > 0 && !seciliOkul && (
            <ul style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: '#1e293b',
              border: '2px solid #334155',
              borderTop: 'none',
              borderRadius: '0 0 12px 12px',
              maxHeight: '300px',
              overflowY: 'auto',
              zIndex: 100,
              listStyle: 'none'
            }}>
              {okullar.map((okul) => (
                <li key={okul}>
                  <button
                    onClick={() => okulSec(okul)}
                    style={{
                      width: '100%',
                      padding: '12px 20px',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      color: '#f1f5f9',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#334155')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {okul}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ display: 'flex', gap: '24px', justifyContent: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={filtreYeni}
              onChange={(e) => setFiltreYeni(e.target.checked)}
              style={{ width: '20px', height: '20px', accentColor: '#2563eb' }}
            />
            <span>Yeni Mezun (İlk denemede kazanan)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={filtreEski}
              onChange={(e) => setFiltreEski(e.target.checked)}
              style={{ width: '20px', height: '20px', accentColor: '#2563eb' }}
            />
            <span>Eski Mezun (Sonraki yıllarda kazanan)</span>
          </label>
        </div>
      </div>

      {(hataGoster && !veri) && (
        <div style={{ padding: '16px', backgroundColor: '#7f1d1d', borderRadius: '12px', textAlign: 'center', marginTop: '16px' }}>
          {hataGoster}
        </div>
      )}

      {veri && hata && (
        <div style={{ padding: '16px', backgroundColor: '#7f1d1d', borderRadius: '12px', textAlign: 'center' }}>
          {hata}
        </div>
      )}

      {yukleniyor && (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '1.5rem' }}>Yükleniyor...</div>
        </div>
      )}

      {(veri && veri.sonuclar && veri.sonuclar.length > 0 && !yukleniyor) && (
        <>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '16px' }}>
              {veri.okul_adi}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb' }}>
                  {veri.istatistik.toplam_ogrenci.toLocaleString('tr-TR')}
                </div>
                <div style={{ color: '#94a3b8' }}>Toplam Öğrenci</div>
              </div>
              <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                  {veri.istatistik.universite_sayisi}
                </div>
                <div style={{ color: '#94a3b8' }}>Üniversite</div>
              </div>
              <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                  {veri.istatistik.bolum_sayisi}
                </div>
                <div style={{ color: '#94a3b8' }}>Bölüm</div>
              </div>
            </div>
          </div>

          {veri && veri.sonuclar && veri.sonuclar.length > 0 && (
            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  const satir = ['Üniversite\tBölüm' + (filtreYeni ? '\tYeni Mezun' : '') + (filtreEski ? '\tEski Mezun' : '') + (filtreYeni && filtreEski ? '\tToplam' : '') + '\t%']
                    .concat(veri.sonuclar.map((item: any) => 
                      [item.university, item.bolum, filtreYeni ? item.yeni_mezun : '', filtreEski ? item.eski_mezun : '', (filtreYeni && filtreEski ? item.toplam : ''), veri.istatistik.toplam_ogrenci > 0 ? ((item.toplam / veri.istatistik.toplam_ogrenci) * 100).toFixed(1) + '%' : '0%'].join('\t')
                    ))
                  navigator.clipboard.writeText(satir.join('\n'))
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Tabloyu Kopyala
              </button>
            </div>
          )}

          <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', minWidth: '600px' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Üniversite</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Bölüm</th>
                    {filtreYeni && <th style={{ padding: '12px 16px', textAlign: 'right' }}>Yeni Mezun</th>}
                    {filtreEski && <th style={{ padding: '12px 16px', textAlign: 'right' }}>Eski Mezun</th>}
                    {filtreYeni && filtreEski && <th style={{ padding: '12px 16px', textAlign: 'right' }}>Toplam</th>}
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {veri.sonuclar.map((item, idx) => {
                    const yuzde = veri.istatistik.toplam_ogrenci > 0 
                      ? ((item.toplam / veri.istatistik.toplam_ogrenci) * 100).toFixed(1)
                      : '0'
                    return (
                      <tr key={idx} style={{ borderTop: '1px solid #334155' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 500 }}>{item.university}</td>
                        <td style={{ padding: '12px 16px' }}>{item.bolum}</td>
                        {filtreYeni && <td style={{ padding: '12px 16px', textAlign: 'right' }}>{item.yeni_mezun}</td>}
                        {filtreEski && <td style={{ padding: '12px 16px', textAlign: 'right' }}>{item.eski_mezun}</td>}
                        {filtreYeni && filtreEski && <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold' }}>{item.toplam}</td>}
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(37, 99, 235, 0.2)',
                            color: '#60a5fa'
                          }}>
                            %{yuzde}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!veri && !hata && !yukleniyor && (
        <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
          <p>Lise adı arayarak başlayabilirsiniz</p>
        </div>
      )}

      <footer style={{ marginTop: '48px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
        <p>Veriler 2024 YKS sonuçlarına dayanmaktadır</p>
      </footer>
    </div>
  )
}

export default App