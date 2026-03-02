import { useEffect, useState } from 'react'
import { getInventory } from '../services/api'

export default function InventoryPage() {
  const [rawData, setRawData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  async function load() {
    const { data } = await getInventory()
    setRawData(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Calculate inventory: group by client + product, sum IN - OUT
  const inventory = Object.values(
    rawData.reduce((acc, op) => {
      const key = `${op.clients?.id}-${op.products?.id}`
      if (!acc[key]) {
        acc[key] = {
          client: op.clients?.name || 'Unknown',
          product: op.products?.name || 'Unknown',
          quantity: 0,
        }
      }
      if (op.type === 'IN') acc[key].quantity += op.quantity
      else acc[key].quantity -= op.quantity
      return acc
    }, {})
  ).sort((a, b) => a.client.localeCompare(b.client))

  const filtered = inventory.filter(item =>
    item.client.toLowerCase().includes(search.toLowerCase()) ||
    item.product.toLowerCase().includes(search.toLowerCase())
  )

  const totalUnits = inventory.reduce((s, i) => s + Math.max(0, i.quantity), 0)
  const positiveItems = inventory.filter(i => i.quantity > 0).length
  const zeroItems = inventory.filter(i => i.quantity <= 0).length

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">المخزون الحالي</h1>
          <p className="page-subtitle">مستويات المخزون الحالية — مجموع (الدخول) - مجموع (الخروج)</p>
        </div>
        <button className="btn btn-secondary" onClick={load}>↻ تحديث</button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'إجمالي الوحدات المرزنة', value: totalUnits.toLocaleString('ar-EG'), color: 'var(--accent-2)' },
          { label: 'العناصر النشطة', value: positiveItems, color: 'var(--accent)' },
          { label: 'فارغة / مرحلة', value: zeroItems, color: 'var(--text-3)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px 20px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: s.color }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="search-bar" style={{ marginBottom: 20 }}>
        <span className="search-icon">🔍</span>
        <input
          placeholder="ابحث بالعميل أو المنتج..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>العميل</th>
              <th>المنتج</th>
              <th>الكمية</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    <div className="icon">▦</div>
                    <p>{search ? 'لا توجد عناصر تطابق بحثك.' : 'لا يوجد بيانات مخزون حتى الآن.'}</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((item, idx) => (
                <tr key={`${item.client}-${item.product}`}>
                  <td style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    {String(idx + 1).padStart(2, '0')}
                  </td>
                  <td style={{ color: 'var(--text)', fontWeight: 500 }}>{item.client}</td>
                  <td>{item.product}</td>
                  <td>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      fontSize: 15,
                      color: item.quantity > 0 ? 'var(--text)' : 'var(--text-3)',
                    }}>
                      {item.quantity.toLocaleString()}
                    </span>
                  </td>
                  <td>
                    {item.quantity > 50 ? (
                      <span className="badge badge-in">● في المخزون</span>
                    ) : item.quantity > 0 ? (
                      <span style={{ background: 'rgba(255,170,0,0.15)', color: 'var(--warning)', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                        ◐ منخفضة
                      </span>
                    ) : (
                      <span style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-3)', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                        ○ فارغة
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <p style={{ marginTop: 14, fontSize: 12, color: 'var(--text-3)', textAlign: 'right' }}>
          عرض {filtered.length} من {inventory.length} عناصر
        </p>
      )}
    </div>
  )
}
