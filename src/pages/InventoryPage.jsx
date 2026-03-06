import { useEffect, useState } from 'react'
import { getInventory } from '../services/api'
import { useLanguage } from '../LanguageContext'
import Barcode from '../components/Barcode'
import Modal from '../components/Modal'

export default function InventoryPage() {
  const { t } = useLanguage()
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [printBatch, setPrintBatch] = useState(null)

  async function load() {
    const { data } = await getInventory()
    setBatches(data || []); setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = batches.filter(b =>
    (b.clients?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.products?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    b.code.toLowerCase().includes(search.toLowerCase())
  )

  const totalKg = batches.reduce((s, b) => s + (b.unit === 'TON' ? b.quantity_remaining * 1000 : b.quantity_remaining), 0)
  const statusMap = {
    ACTIVE: { label: t.statusActive, color: 'var(--accent-2)', bg: 'rgba(0,212,170,0.12)' },
    PARTIAL: { label: t.statusPartial, color: 'var(--warning)', bg: 'rgba(255,170,0,0.12)' },
  }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">{t.inventory}</h1><p className="page-subtitle">{t.inventorySubtitle}</p></div>
        <button className="btn btn-secondary" onClick={load}>↻ {t.refresh}</button>
      </div>

      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: t.totalInventory, value: totalKg >= 1000 ? `${(totalKg/1000).toFixed(2)} ${t.ton}` : `${totalKg.toFixed(0)} ${t.kg}`, color: 'var(--accent-2)' },
          { label: t.activeBatchesCount, value: batches.filter(b=>b.status==='ACTIVE').length, color: 'var(--accent)' },
          { label: t.partialBatches, value: batches.filter(b=>b.status==='PARTIAL').length, color: 'var(--warning)' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:'14px 20px',display:'flex',alignItems:'center',gap:12 }}>
            <div style={{ fontFamily:'var(--font-mono)',fontSize:22,fontWeight:700,color:s.color }}>{s.value}</div>
            <div style={{ fontSize:12,color:'var(--text-3)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="search-bar" style={{ marginBottom: 20 }}>
        <span className="search-icon">🔍</span>
        <input placeholder={t.searchInventory} value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Mobile cards */}
      <div className="mobile-cards">
        {filtered.map((b, idx) => {
          const pct = Math.round((b.quantity_remaining / b.quantity_original) * 100)
          const s = statusMap[b.status]
          return (
            <div key={b.id} className="mobile-card" onClick={() => setPrintBatch(b)}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <span style={{ fontFamily:'var(--font-mono)',fontSize:13,fontWeight:700,color:'var(--accent)' }}>{b.code}</span>
                <span style={{ background:s?.bg,color:s?.color,padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700 }}>{s?.label}</span>
              </div>
              <div style={{ fontWeight:600,color:'var(--text)',marginBottom:4 }}>{b.clients?.name}</div>
              <div style={{ fontSize:13,color:'var(--text-3)',marginBottom:10 }}>{b.products?.name}</div>
              <div style={{ display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:8 }}>
                <span style={{ color:'var(--text-3)' }}>{t.remaining}</span>
                <span style={{ fontFamily:'var(--font-mono)',fontWeight:700 }}>{b.quantity_remaining} / {b.quantity_original} {b.unit==='KG'?t.kg:t.ton}</span>
              </div>
              <div style={{ height:6,background:'var(--border)',borderRadius:3,overflow:'hidden',marginBottom:10 }}>
                <div style={{ height:'100%',width:`${pct}%`,background:pct>50?'var(--accent-2)':'var(--warning)',borderRadius:3 }} />
              </div>
              <div style={{ fontSize:12,color:'var(--text-3)',textAlign:'center',borderTop:'1px solid var(--border)',paddingTop:8 }}>
                🖨️ {t.print}
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && <div className="empty-state"><div className="icon">▦</div><p>{search ? t.noResults : t.noInventory}</p></div>}
      </div>

      {/* Desktop table */}
      <div className="desktop-table">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>#</th><th>{t.batchCode}</th><th>{t.client}</th><th>{t.product}</th><th>{t.original}</th><th>{t.remaining}</th><th>{t.unit}</th><th>{t.status}</th><th>{t.entryDate}</th><th>🖨️</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9}><div className="empty-state"><div className="icon">▦</div><p>{search ? t.noResults : t.noInventory}</p></div></td></tr>
              ) : filtered.map((b, idx) => {
                const pct = Math.round((b.quantity_remaining / b.quantity_original) * 100)
                const s = statusMap[b.status]
                return (
                  <tr key={b.id}>
                    <td style={{ color:'var(--text-3)',fontFamily:'var(--font-mono)',fontSize:12 }}>{String(idx+1).padStart(2,'0')}</td>
                    <td style={{ fontFamily:'var(--font-mono)',fontSize:12,fontWeight:700,color:'var(--accent)' }}>{b.code}</td>
                    <td style={{ color:'var(--text)',fontWeight:600 }}>{b.clients?.name}</td>
                    <td>{b.products?.name}</td>
                    <td style={{ fontFamily:'var(--font-mono)' }}>{b.quantity_original}</td>
                    <td>
                      <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                        <span style={{ fontFamily:'var(--font-mono)',fontWeight:700 }}>{b.quantity_remaining}</span>
                        <div style={{ width:50,height:4,background:'var(--border)',borderRadius:2 }}>
                          <div style={{ height:'100%',width:`${pct}%`,background:pct>50?'var(--accent-2)':'var(--warning)',borderRadius:2 }} />
                        </div>
                        <span style={{ fontSize:11,color:'var(--text-3)' }}>{pct}%</span>
                      </div>
                    </td>
                    <td><span style={{ fontSize:12,color:'var(--text-3)' }}>{b.unit==='KG'?t.kg:t.ton}</span></td>
                    <td><span style={{ background:s?.bg,color:s?.color,padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700 }}>{s?.label}</span></td>
                    <td style={{ fontSize:12,color:'var(--text-3)' }}>{new Date(b.created_at).toLocaleString([],{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => setPrintBatch(b)}>🖨️ {t.print}</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {printBatch && <BatchPrintModal batch={printBatch} t={t} onClose={() => setPrintBatch(null)} />}
    </div>
  )
}

function BatchPrintModal({ batch, t, onClose }) {
  function handlePrint() {
    const printWin = window.open('', '_blank', 'width=450,height=680')

    function getBars(text) {
      const C128 = [[2,1,1,4,1,2],[2,1,2,4,1,1],[2,1,2,1,1,4],[2,1,2,1,4,1],[2,1,4,1,1,2],[2,1,4,1,2,1],[2,1,4,2,1,1],[2,3,1,1,1,2],[2,3,1,2,1,1],[2,3,2,1,1,1],[3,1,1,1,2,2],[3,1,1,2,2,1],[3,1,2,1,1,2],[3,1,2,2,1,1],[3,2,1,1,1,2],[3,2,1,1,2,1],[3,2,1,2,1,1],[3,2,2,1,1,1],[3,1,1,1,3,1],[3,1,3,1,1,1],[3,1,1,3,1,1],[2,1,1,3,2,1],[2,1,1,1,2,3],[2,1,1,1,3,2],[2,1,3,1,1,2],[2,1,3,2,1,1],[2,1,1,2,1,3],[2,1,1,3,1,2],[3,1,1,1,1,3],[2,1,3,1,2,1],[2,1,1,2,3,1],[2,3,1,1,2,1],[2,3,2,1,1,1],[3,1,1,2,1,2],[3,1,1,1,2,2],[3,2,1,1,1,2],[3,2,1,2,1,1],[3,2,2,1,1,1],[2,1,2,3,1,1],[2,1,1,2,2,2],[2,2,1,2,1,2],[1,1,2,2,1,3],[1,1,2,3,1,2],[1,2,3,1,1,2],[1,1,3,2,1,2],[1,2,3,2,1,1],[1,2,1,3,2,1],[1,3,2,1,1,2],[1,3,1,2,2,1],[1,3,2,2,1,1],[2,1,1,4,2,1],[2,1,1,1,4,2],[2,1,1,2,4,1],[2,1,4,2,1,1],[2,1,1,4,1,2],[2,1,2,4,1,1],[2,1,4,1,2,1],[2,1,4,1,1,2],[2,4,1,1,2,1],[2,4,1,2,1,1],[2,4,2,1,1,1],[2,1,2,1,4,1],[2,1,2,1,1,4],[2,1,1,4,1,2],[2,1,4,1,1,2],[2,4,1,1,1,2],[2,4,1,1,2,1],[3,1,1,1,4,1],[3,1,1,4,1,1],[3,1,4,1,1,1],[4,1,1,1,1,3],[4,1,1,3,1,1],[4,3,1,1,1,1],[1,1,4,2,1,2],[1,2,4,1,1,2],[1,2,4,2,1,1],[1,1,2,1,4,2],[1,1,2,4,1,2],[1,2,2,1,1,4],[1,2,2,4,1,1],[1,4,2,1,1,2],[1,4,2,2,1,1],[1,1,1,2,4,2],[1,1,1,4,2,2],[1,2,1,1,4,2],[1,2,1,4,1,2],[1,4,1,1,2,2],[1,4,1,2,2,1],[1,1,4,1,1,3],[1,1,4,3,1,1],[4,1,1,1,3,1],[4,1,1,3,1,1],[2,3,3,1,1,1,2]]
      const START_B = 104, STOP = 106
      let checksum = START_B, chars = []
      for (let i = 0; i < text.length; i++) { const code = text.charCodeAt(i) - 32; checksum += code * (i + 1); chars.push(code) }
      const all = [START_B, ...chars, checksum % 103, STOP]
      let cx = 0, bars = []
      all.forEach(c => { const p = C128[c]||C128[0]; p.forEach((w,i)=>{ bars.push({x:cx,w:w*2,bar:i%2===0}); cx+=w*2 }) })
      return { bars, total: cx }
    }

    const { bars, total } = getBars(batch.code)
    const svgBars = bars.filter(b=>b.bar).map(b=>`<rect x="${b.x}" y="0" width="${b.w}" height="70" fill="black"/>`).join('')
    const barcodeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="90" viewBox="0 0 ${total} 90"><rect width="${total}" height="90" fill="white"/>${svgBars}<text x="${total/2}" y="85" text-anchor="middle" font-size="12" font-family="Courier New" font-weight="bold" letter-spacing="4">${batch.code}</text></svg>`
    const barcodeB64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(barcodeSvg)))

    const statusLabel = batch.status === 'ACTIVE' ? (t.statusActive + ' ✓') : batch.status === 'PARTIAL' ? t.statusPartial : t.statusClosed

    printWin.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Batch ${batch.code}</title>
      <style>
        body{font-family:Arial,sans-serif;margin:0;padding:20px;background:#fff;color:#000;max-width:380px}
        .header{text-align:center;border-bottom:2px solid #000;padding-bottom:14px;margin-bottom:18px}
        .logo{font-size:32px}.company{font-size:22px;font-weight:900;letter-spacing:3px}.sub{font-size:11px;color:#666;letter-spacing:1px;margin-top:2px}
        .bc-wrap{text-align:center;margin:18px 0;padding:12px;border:1px solid #ddd;border-radius:6px}
        .bc-wrap img{max-width:100%;height:auto}
        .details{border:1px solid #eee;border-radius:6px;overflow:hidden}
        .row{display:flex;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #f0f0f0;font-size:13px}
        .row:last-child{border-bottom:none}.row .lbl{color:#888}.row .val{font-weight:700;text-align:right}
        .footer{text-align:center;margin-top:18px;font-size:10px;color:#aaa;padding-top:10px;border-top:1px solid #eee}
      </style>
    </head><body>
      <div class="header"><div class="logo">❄</div><div class="company">COLDSTORE</div><div class="sub">COLD STORAGE FACILITY</div></div>
      <div class="bc-wrap"><img src="${barcodeB64}" alt="${batch.code}" /></div>
      <div class="details">
        <div class="row"><span class="lbl">Client / العميل</span><span class="val">${batch.clients?.name}</span></div>
        <div class="row"><span class="lbl">Product / المنتج</span><span class="val">${batch.products?.name}</span></div>
        <div class="row"><span class="lbl">Original Qty / الأصلي</span><span class="val">${batch.quantity_original} ${batch.unit}</span></div>
        <div class="row"><span class="lbl">Remaining / المتبقي</span><span class="val">${batch.quantity_remaining} ${batch.unit}</span></div>
        <div class="row"><span class="lbl">Entry Date / تاريخ الدخول</span><span class="val">${new Date(batch.created_at).toLocaleString([],{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}</span></div>
        <div class="row"><span class="lbl">Status / الحالة</span><span class="val">${statusLabel}</span></div>
      </div>
      <div class="footer">Reprinted — COLDSTORE System — ${new Date().toLocaleString()}</div>
    </body></html>`)
    printWin.document.close()
    setTimeout(() => printWin.print(), 600)
  }

  const unit = batch.unit === 'KG' ? t.kg : t.ton
  const statusMap = {
    ACTIVE: { label: t.statusActive, color: 'var(--accent-2)', bg: 'rgba(0,212,170,0.12)' },
    PARTIAL: { label: t.statusPartial, color: 'var(--warning)', bg: 'rgba(255,170,0,0.12)' },
    CLOSED: { label: t.statusClosed, color: 'var(--text-3)', bg: 'rgba(255,255,255,0.07)' },
  }
  const s = statusMap[batch.status]

  return (
    <Modal title={`🖨️ ${t.printCard} — ${batch.code}`} onClose={onClose} footer={
      <><button className="btn btn-secondary" onClick={onClose}>{t.close}</button>
        <button className="btn btn-primary" onClick={handlePrint}>{t.printCard}</button></>
    }>
      <div style={{ textAlign: 'center', padding: '4px 0 16px' }}>
        {/* Barcode preview */}
        <div style={{ background: '#fff', padding: '14px 12px 8px', borderRadius: 8, display: 'inline-block', marginBottom: 16, border: '1px solid var(--border)' }}>
          <Barcode value={batch.code} width={280} height={65} />
        </div>

        {/* Batch details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, textAlign: 'left', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)' }}>
          {[
            [t.client, batch.clients?.name, 'var(--text)'],
            [t.product, batch.products?.name, 'var(--text)'],
            [t.original, `${batch.quantity_original} ${unit}`, 'var(--text)'],
            [t.remaining, `${batch.quantity_remaining} ${unit}`, batch.quantity_remaining > 0 ? 'var(--accent-2)' : 'var(--text-3)'],
            [t.entryDate, new Date(batch.created_at).toLocaleString([], { year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit' }), 'var(--text-3)'],
            [t.status, <span style={{ background: s?.bg, color: s?.color, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{s?.label}</span>, null],
          ].map(([k, v, color]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
              <span style={{ color: 'var(--text-3)' }}>{k}</span>
              <span style={{ color: color || 'inherit', fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
