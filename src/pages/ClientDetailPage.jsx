import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getClients, getClientTransactions, getProducts } from '../services/api'

export default function ClientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ product_id: '', date_from: '', date_to: '' })

  async function load() {
    const [clientsRes, productsRes] = await Promise.all([getClients(), getProducts()])
    const found = clientsRes.data?.find(c => c.id === id)
    setClient(found || null)
    setProducts(productsRes.data || [])
    await loadTx({})
    setLoading(false)
  }

  async function loadTx(f) {
    const { data } = await getClientTransactions(id, f)
    setTransactions(data || [])
  }

  useEffect(() => { load() }, [id])

  async function applyFilters() {
    await loadTx(filters)
  }

  function resetFilters() {
    const empty = { product_id: '', date_from: '', date_to: '' }
    setFilters(empty)
    loadTx(empty)
  }

  function handlePdfExport() {
    const printWin = window.open('', '_blank', 'width=800,height=700')
    const rows = transactions.map(t => `
      <tr>
        <td>${t.type === 'IN' ? '↓ دخول' : '↑ خروج'}</td>
        <td>${t.products?.name || '—'}</td>
        <td>${t.batches?.code || '—'}</td>
        <td>${t.quantity} ${t.unit === 'KG' ? 'كجم' : 'طن'}</td>
        <td>${new Date(t.created_at).toLocaleString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
        <td>${t.notes || '—'}</td>
      </tr>
    `).join('')

    printWin.document.write(`<!DOCTYPE html><html dir="rtl"><head>
      <meta charset="UTF-8"><title>كشف حساب - ${client?.name}</title>
      <style>
        body { font-family: Arial; margin: 20px; font-size: 13px; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        .sub { color: #888; margin-bottom: 20px; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: right; }
        th { background: #f5f5f5; font-weight: 700; }
        .in { color: green; font-weight: 700; }
        .out { color: orange; font-weight: 700; }
        .footer { margin-top: 20px; font-size: 11px; color: #aaa; text-align: center; }
      </style>
    </head><body>
      <h1>❄ COLDSTORE — كشف حساب</h1>
      <p class="sub">العميل: <strong>${client?.name}</strong> | الهاتف: ${client?.phone || '—'} | تاريخ الطباعة: ${new Date().toLocaleString('ar-EG')}</p>
      <table>
        <thead><tr><th>النوع</th><th>المنتج</th><th>كود الشحنة</th><th>الكمية</th><th>التاريخ والوقت</th><th>ملاحظات</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="footer">إجمالي العمليات: ${transactions.length} عملية — تم الإنشاء بواسطة COLDSTORE System</p>
    </body></html>`)
    printWin.document.close()
    setTimeout(() => printWin.print(), 400)
  }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>
  if (!client) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-3)' }}>العميل غير موجود</div>

  const totalIn = transactions.filter(t => t.type === 'IN').reduce((s, t) => s + t.quantity, 0)
  const totalOut = transactions.filter(t => t.type === 'OUT').reduce((s, t) => s + t.quantity, 0)

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/clients')} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 20, padding: 4 }}>→</button>
          <div>
            <h1 className="page-title">{client.name}</h1>
            <p className="page-subtitle">{client.phone || 'لا يوجد هاتف'} {client.notes ? `— ${client.notes}` : ''}</p>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={handlePdfExport}>🖨️ تصدير PDF</button>
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        {[
          { label: 'إجمالي العمليات', value: transactions.length, color: 'var(--accent)' },
          { label: 'إجمالي الدخول', value: `${totalIn.toLocaleString()} وحدة`, color: 'var(--accent-2)' },
          { label: 'إجمالي الخروج', value: `${totalOut.toLocaleString()} وحدة`, color: 'var(--warning)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: 18 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ minWidth: 160, flex: 1 }}>
            <label>المنتج</label>
            <select value={filters.product_id} onChange={e => setFilters(f => ({ ...f, product_id: e.target.value }))}>
              <option value="">كل المنتجات</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ minWidth: 140 }}>
            <label>من تاريخ</label>
            <input type="date" value={filters.date_from} onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))} />
          </div>
          <div className="form-group" style={{ minWidth: 140 }}>
            <label>إلى تاريخ</label>
            <input type="date" value={filters.date_to} onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))} />
          </div>
          <button className="btn btn-primary" onClick={applyFilters}>بحث</button>
          <button className="btn btn-secondary" onClick={resetFilters}>إعادة تعيين</button>
        </div>
      </div>

      {/* Transactions table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>النوع</th>
              <th>المنتج</th>
              <th>كود الشحنة</th>
              <th>الكمية</th>
              <th>التاريخ والوقت</th>
              <th>ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr><td colSpan={6}><div className="empty-state"><div className="icon">📋</div><p>لا توجد تعاملات</p></div></td></tr>
            ) : transactions.map(t => (
              <tr key={t.id}>
                <td>
                  <span className={`badge badge-${t.type.toLowerCase()}`}>{t.type === 'IN' ? '↓ دخول' : '↑ خروج'}</span>
                </td>
                <td style={{ color: 'var(--text)', fontWeight: 500 }}>{t.products?.name}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)' }}>{t.batches?.code || '—'}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{t.quantity} {t.unit === 'KG' ? 'كجم' : 'طن'}</td>
                <td style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  {new Date(t.created_at).toLocaleString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{t.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
