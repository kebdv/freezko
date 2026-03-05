import { useEffect, useState } from 'react'
import { getInventory } from '../services/api'

export default function InventoryPage() {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  async function load() {
    const { data } = await getInventory()
    setBatches(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = batches.filter(b =>
    (b.clients?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.products?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    b.code.toLowerCase().includes(search.toLowerCase())
  )

  const totalKg = batches.reduce((s, b) => {
    return s + (b.unit === 'TON' ? b.quantity_remaining * 1000 : b.quantity_remaining)
  }, 0)

  const statusMap = {
    ACTIVE: { label: 'نشطة', color: 'var(--accent-2)', bg: 'rgba(0,212,170,0.12)' },
    PARTIAL: { label: 'جزئية', color: 'var(--warning)', bg: 'rgba(255,170,0,0.12)' },
  }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">المخزون</h1>
          <p className="page-subtitle">الشحنات النشطة في المستودع</p>
        </div>
        <button className="btn btn-secondary" onClick={load}>↻ تحديث</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'إجمالي المخزون', value: totalKg >= 1000 ? `${(totalKg / 1000).toFixed(2)} طن` : `${totalKg.toFixed(0)} كجم`, color: 'var(--accent-2)' },
          { label: 'شحنات نشطة', value: batches.filter(b => b.status === 'ACTIVE').length, color: 'var(--accent)' },
          { label: 'شحنات جزئية', value: batches.filter(b => b.status === 'PARTIAL').length, color: 'var(--warning)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="search-bar" style={{ marginBottom: 20 }}>
        <span className="search-icon">🔍</span>
        <input placeholder="بحث بالعميل أو المنتج أو الكود..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>كود الشحنة</th>
              <th>العميل</th>
              <th>المنتج</th>
              <th>الأصلي</th>
              <th>المتبقي</th>
              <th>الوحدة</th>
              <th>الحالة</th>
              <th>تاريخ الدخول</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9}><div className="empty-state"><div className="icon">▦</div><p>{search ? 'لا نتائج' : 'المخزن فارغ'}</p></div></td></tr>
            ) : filtered.map((b, idx) => {
              const pct = Math.round((b.quantity_remaining / b.quantity_original) * 100)
              const s = statusMap[b.status]
              return (
                <tr key={b.id}>
                  <td style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{String(idx + 1).padStart(2, '0')}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{b.code}</td>
                  <td style={{ color: 'var(--text)', fontWeight: 600 }}>{b.clients?.name}</td>
                  <td>{b.products?.name}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{b.quantity_original}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{b.quantity_remaining}</span>
                      <div style={{ width: 50, height: 4, background: 'var(--border)', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pct > 50 ? 'var(--accent-2)' : 'var(--warning)', borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{pct}%</span>
                    </div>
                  </td>
                  <td><span style={{ fontSize: 12, color: 'var(--text-3)' }}>{b.unit === 'KG' ? 'كجم' : 'طن'}</span></td>
                  <td><span style={{ background: s?.bg, color: s?.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{s?.label}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--text-3)' }}>
                    {new Date(b.created_at).toLocaleString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
