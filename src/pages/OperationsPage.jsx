import { useEffect, useState } from 'react'
import { getClients, getProducts, getOperations, addOperation } from '../services/api'

const emptyForm = { client_id: '', product_id: '', quantity: '' }

export default function OperationsPage() {
  const [clients, setClients] = useState([])
  const [products, setProducts] = useState([])
  const [operations, setOperations] = useState([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('IN')
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function load() {
    const [c, p, o] = await Promise.all([getClients(), getProducts(), getOperations()])
    setClients(c.data || [])
    setProducts(p.data || [])
    setOperations(o.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.client_id || !form.product_id || !form.quantity) {
      setError('جميع الحقول مطلوبة')
      return
    }
    if (parseInt(form.quantity) <= 0) {
      setError('الكمية يجب أن تكون أكبر من 0')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    const { error } = await addOperation({
      client_id: form.client_id,
      product_id: form.product_id,
      quantity: parseInt(form.quantity),
      type: mode,
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(`تم تسجيل عملية ${mode === 'IN' ? 'دخول' : 'خروج'} بنجاح!`)
      setForm(emptyForm)
      load()
    }
    setSaving(false)
  }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">العمليات</h1>
          <p className="page-subtitle">تسجيل البضائع الواردة والصادرة</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Form panel */}
        <div className="card" style={{ position: 'sticky', top: 0 }}>
          {/* Mode toggle */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-3)',
            borderRadius: 'var(--radius-sm)',
            padding: 4,
            marginBottom: 24,
            border: '1px solid var(--border)',
          }}>
            {['IN', 'OUT'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess('') }}
                style={{
                  flex: 1, padding: '9px', border: 'none', cursor: 'pointer',
                  borderRadius: 'calc(var(--radius-sm) - 2px)',
                  fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600,
                  transition: 'all 0.18s',
                  background: mode === m
                    ? (m === 'IN' ? 'var(--accent-2)' : 'var(--warning)')
                    : 'transparent',
                  color: mode === m ? '#000' : 'var(--text-3)',
                }}
              >
                {m === 'IN' ? '\u2193 دخول' : '\u2191 خروج'}
              </button>
            ))}
          </div>

          <div style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            background: mode === 'IN' ? 'rgba(0,212,170,0.08)' : 'rgba(255,170,0,0.08)',
            border: `1px solid ${mode === 'IN' ? 'rgba(0,212,170,0.2)' : 'rgba(255,170,0,0.2)'}`,
            marginBottom: 20,
            fontSize: 13,
            color: mode === 'IN' ? 'var(--accent-2)' : 'var(--warning)',
          }}>
            {mode === 'IN'
              ? '\ud83d\udce5 تسجيل البضاع الواردة للمستودع'
              : '\ud83d\udce4 تسجيل البضاع المغادرة للمستودع'}
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label>العميل *</label>
              <select
                value={form.client_id}
                onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
              >
                <option value="">اختر عميل...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>المنتج *</label>
              <select
                value={form.product_id}
                onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))}
              >
                <option value="">اختر منتج...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>الكمية *</label>
              <input
                type="number"
                min="1"
                placeholder="أدخل الكمية (كل / وحدات)"
                value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label>التاريخ</label>
              <input
                type="text"
                value={new Date().toLocaleString('ar-EG')}
                disabled
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
              />
            </div>

            <button
              type="submit"
              className="btn"
              disabled={saving}
              style={{
                width: '100%', justifyContent: 'center', padding: '12px',
                background: mode === 'IN' ? 'var(--accent-2)' : 'var(--warning)',
                color: '#000', fontWeight: 600, marginTop: 4,
              }}
            >
              {saving ? (
                <><div className="spinner" style={{ width: 16, height: 16 }} /> جاري المعالجة...</>
              ) : `تسجيل عملية ${mode === 'IN' ? 'دخول' : 'خروج'}`}
            </button>
          </form>
        </div>

        {/* Operations list */}
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)', marginBottom: 16 }}>
            العمليات الأخيرة
          </h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>نوع</th>
                  <th>العميل</th>
                  <th>المنتج</th>
                  <th>الكمية</th>
                  <th>التاريخ والوقت</th>
                </tr>
              </thead>
              <tbody>
                {operations.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">
                        <div className="icon">⇅</div>
                        <p>لا توجد عمليات حتى الآن.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  operations.map(op => (
                    <tr key={op.id}>
                      <td>
                        <span className={`badge badge-${op.type.toLowerCase()}`}>{op.type}</span>
                      </td>
                      <td style={{ color: 'var(--text)', fontWeight: 500 }}>{op.clients?.name}</td>
                      <td>{op.products?.name}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
                        {op.quantity.toLocaleString()}
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {new Date(op.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
