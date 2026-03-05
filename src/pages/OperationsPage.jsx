import { useEffect, useState, useRef } from 'react'
import { getClients, getProducts, getClientActiveBatches, createBatch, getBatches } from '../services/api'
import Modal from '../components/Modal'
import OutConfirmModal from '../components/OutConfirmModal'

const emptyInForm = { client_id: '', product_id: '', quantity: '', unit: 'KG', notes: '' }

export default function OperationsPage() {
  const [clients, setClients] = useState([])
  const [products, setProducts] = useState([])
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('IN')

  // IN form
  const [inForm, setInForm] = useState(emptyInForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [newBatch, setNewBatch] = useState(null)
  const [showPrint, setShowPrint] = useState(false)

  // OUT form
  const [outClientId, setOutClientId] = useState('')
  const [clientBatches, setClientBatches] = useState([])
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [outQty, setOutQty] = useState('')
  const [outNotes, setOutNotes] = useState('')
  const [outError, setOutError] = useState('')
  const [showOutConfirm, setShowOutConfirm] = useState(false)

  async function load() {
    const [c, p, b] = await Promise.all([getClients(), getProducts(), getBatches()])
    setClients(c.data || [])
    setProducts(p.data || [])
    setBatches(b.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleClientChange(clientId) {
    setOutClientId(clientId)
    setSelectedBatch(null)
    setOutQty('')
    setOutError('')
    if (clientId) {
      const { data } = await getClientActiveBatches(clientId)
      setClientBatches(data || [])
    } else {
      setClientBatches([])
    }
  }

  async function handleInSubmit(e) {
    e.preventDefault()
    if (!inForm.client_id || !inForm.product_id || !inForm.quantity) {
      setError('جميع الحقول مطلوبة'); return
    }
    setSaving(true); setError('')
    const { data, error } = await createBatch(inForm)
    if (error) { setError(error.message); setSaving(false); return }
    setNewBatch(data)
    setInForm(emptyInForm)
    setShowPrint(true)
    setSaving(false)
    load()
  }

  function handleOutConfirm() {
    if (!selectedBatch) { setOutError('اختر شحنة أولاً'); return }
    if (!outQty || parseFloat(outQty) <= 0) { setOutError('أدخل الكمية'); return }
    if (parseFloat(outQty) > selectedBatch.quantity_remaining) {
      setOutError(`الكمية أكبر من المتاح (${selectedBatch.quantity_remaining} ${selectedBatch.unit})`); return
    }
    setOutError('')
    setShowOutConfirm(true)
  }

  function handleOutSuccess() {
    setShowOutConfirm(false)
    setOutClientId('')
    setClientBatches([])
    setSelectedBatch(null)
    setOutQty('')
    setOutNotes('')
    load()
  }

  const statusBadge = (status) => {
    const map = {
      ACTIVE: { label: 'نشطة', bg: 'rgba(0,212,170,0.15)', color: 'var(--accent-2)' },
      PARTIAL: { label: 'جزئية', bg: 'rgba(255,170,0,0.15)', color: 'var(--warning)' },
      CLOSED: { label: 'مقفلة', bg: 'rgba(255,255,255,0.07)', color: 'var(--text-3)' },
    }
    const s = map[status] || map.ACTIVE
    return <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{s.label}</span>
  }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">العمليات</h1>
          <p className="page-subtitle">تسجيل دخول وخروج البضائع</p>
        </div>
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)', padding: 4, marginBottom: 24, border: '1px solid var(--border)', maxWidth: 320 }}>
        {['IN', 'OUT'].map(m => (
          <button key={m} onClick={() => { setMode(m); setError(''); setOutError('') }} style={{
            flex: 1, padding: '10px', border: 'none', cursor: 'pointer',
            borderRadius: 'calc(var(--radius-sm) - 2px)',
            fontFamily: 'var(--font)', fontSize: 14, fontWeight: 700,
            transition: 'all 0.18s',
            background: mode === m ? (m === 'IN' ? 'var(--accent-2)' : 'var(--warning)') : 'transparent',
            color: mode === m ? '#000' : 'var(--text-3)',
          }}>
            {m === 'IN' ? '↓ دخول' : '↑ خروج'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 24, alignItems: 'start' }}>

        {/* IN FORM */}
        {mode === 'IN' && (
          <div className="card">
            <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', marginBottom: 20, fontSize: 13, color: 'var(--accent-2)' }}>
              📥 تسجيل بضاعة واردة — سيتم إنشاء Batch جديد
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleInSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label>العميل *</label>
                <select value={inForm.client_id} onChange={e => setInForm(f => ({ ...f, client_id: e.target.value }))}>
                  <option value="">اختر عميل...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>المنتج *</label>
                <select value={inForm.product_id} onChange={e => setInForm(f => ({ ...f, product_id: e.target.value }))}>
                  <option value="">اختر منتج...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 10 }}>
                <div className="form-group">
                  <label>الكمية *</label>
                  <input type="number" min="0.1" step="0.1" placeholder="0.00" value={inForm.quantity} onChange={e => setInForm(f => ({ ...f, quantity: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>الوحدة</label>
                  <select value={inForm.unit} onChange={e => setInForm(f => ({ ...f, unit: e.target.value }))}>
                    <option value="KG">كيلو</option>
                    <option value="TON">طن</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>ملاحظات</label>
                <textarea placeholder="ملاحظات اختيارية..." rows={2} value={inForm.notes} onChange={e => setInForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: 'none' }} />
              </div>
              <div className="form-group">
                <label>التاريخ</label>
                <input type="text" value={new Date().toLocaleString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })} disabled style={{ opacity: 0.5 }} />
              </div>
              <button type="submit" disabled={saving} className="btn" style={{ width: '100%', justifyContent: 'center', padding: '12px', background: 'var(--accent-2)', color: '#000', fontWeight: 700 }}>
                {saving ? <><div className="spinner" style={{ width: 16, height: 16 }} /> جاري الحفظ...</> : '📥 تسجيل الدخول'}
              </button>
            </form>
          </div>
        )}

        {/* OUT FORM */}
        {mode === 'OUT' && (
          <div className="card">
            <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,170,0,0.08)', border: '1px solid rgba(255,170,0,0.2)', marginBottom: 20, fontSize: 13, color: 'var(--warning)' }}>
              📤 تسجيل بضاعة صادرة — اختر شحنة من الموجود
            </div>
            {outError && <div className="alert alert-error">{outError}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label>العميل *</label>
                <select value={outClientId} onChange={e => handleClientChange(e.target.value)}>
                  <option value="">اختر عميل...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {outClientId && (
                <>
                  <div className="form-group">
                    <label>الشحنة (Batch) *</label>
                    {clientBatches.length === 0 ? (
                      <div style={{ padding: '12px', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)', color: 'var(--text-3)', fontSize: 13, textAlign: 'center' }}>
                        لا توجد شحنات نشطة لهذا العميل
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {clientBatches.map(b => (
                          <div key={b.id} onClick={() => { setSelectedBatch(b); setOutError('') }} style={{
                            padding: '12px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                            border: `1px solid ${selectedBatch?.id === b.id ? 'var(--warning)' : 'var(--border)'}`,
                            background: selectedBatch?.id === b.id ? 'rgba(255,170,0,0.08)' : 'var(--bg-3)',
                            transition: 'all 0.15s',
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{b.code}</span>
                              {statusBadge(b.status)}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                              {b.products?.name} — متبقي: <strong style={{ color: 'var(--text)' }}>{b.quantity_remaining} {b.unit === 'KG' ? 'كجم' : 'طن'}</strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedBatch && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 10 }}>
                        <div className="form-group">
                          <label>الكمية الخارجة *</label>
                          <input type="number" min="0.1" step="0.1" max={selectedBatch.quantity_remaining}
                            placeholder={`max: ${selectedBatch.quantity_remaining}`}
                            value={outQty} onChange={e => setOutQty(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label>الوحدة</label>
                          <input type="text" value={selectedBatch.unit === 'KG' ? 'كيلو' : 'طن'} disabled style={{ opacity: 0.5 }} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>سبب الخروج / ملاحظة</label>
                        <textarea placeholder="مثال: تسليم للعميل، بضاعة تالفة..." rows={2}
                          value={outNotes} onChange={e => setOutNotes(e.target.value)} style={{ resize: 'none' }} />
                      </div>
                    </>
                  )}
                </>
              )}

              <button onClick={handleOutConfirm} disabled={!selectedBatch || !outQty} className="btn" style={{
                width: '100%', justifyContent: 'center', padding: '12px',
                background: 'var(--warning)', color: '#000', fontWeight: 700,
                opacity: (!selectedBatch || !outQty) ? 0.5 : 1,
              }}>
                📤 تأكيد الخروج
              </button>
            </div>
          </div>
        )}

        {/* Recent Batches */}
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)', marginBottom: 16 }}>آخر الشحنات</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>الكود</th>
                  <th>العميل</th>
                  <th>المنتج</th>
                  <th>الكمية الأصلية</th>
                  <th>المتبقي</th>
                  <th>الحالة</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {batches.slice(0, 20).map(b => (
                  <tr key={b.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)' }}>{b.code}</td>
                    <td style={{ color: 'var(--text)', fontWeight: 500 }}>{b.clients?.name}</td>
                    <td>{b.products?.name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{b.quantity_original} {b.unit === 'KG' ? 'كجم' : 'طن'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: b.quantity_remaining === 0 ? 'var(--text-3)' : 'var(--text)' }}>
                      {b.quantity_remaining} {b.unit === 'KG' ? 'كجم' : 'طن'}
                    </td>
                    <td>{statusBadge(b.status)}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      {new Date(b.created_at).toLocaleString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Print Modal */}
      {showPrint && newBatch && (
        <PrintBatchModal batch={newBatch} onClose={() => { setShowPrint(false); setNewBatch(null) }} />
      )}

      {/* Out Confirm Modal */}
      {showOutConfirm && selectedBatch && (
        <OutConfirmModal
          batch={selectedBatch}
          quantity={parseFloat(outQty)}
          notes={outNotes}
          onClose={() => setShowOutConfirm(false)}
          onSuccess={handleOutSuccess}
          onKeepData={() => setShowOutConfirm(false)}
        />
      )}

      <style>{`
        @media (max-width: 900px) {
          div[style*="gridTemplateColumns: 400px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

// ===== Print Modal =====
function PrintBatchModal({ batch, onClose }) {
  function handlePrint() {
    const printWin = window.open('', '_blank', 'width=400,height=600')
    printWin.document.write(`
      <!DOCTYPE html><html><head>
      <meta charset="UTF-8">
      <title>Batch ${batch.code}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #fff; color: #000; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; }
        .logo { font-size: 28px; margin-bottom: 4px; }
        .company { font-size: 20px; font-weight: 900; letter-spacing: 2px; }
        .subtitle { font-size: 11px; color: #666; letter-spacing: 1px; margin-top: 2px; }
        .barcode-section { text-align: center; margin: 16px 0; }
        .barcode-text { font-family: 'Courier New', monospace; font-size: 32px; font-weight: 900; letter-spacing: 4px; border: 3px solid #000; display: inline-block; padding: 10px 20px; margin: 8px 0; }
        .code-label { font-size: 13px; color: #666; margin-top: 4px; }
        .details { margin-top: 16px; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; font-size: 14px; }
        .row .label { color: #666; }
        .row .value { font-weight: 700; }
        .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #999; padding-top: 10px; border-top: 1px solid #eee; }
      </style>
      </head><body>
      <div class="header">
        <div class="logo">❄</div>
        <div class="company">COLDSTORE</div>
        <div class="subtitle">COLD STORAGE FACILITY</div>
      </div>
      <div class="barcode-section">
        <div class="barcode-text">${batch.code}</div>
        <div class="code-label">كود الشحنة / Batch Code</div>
      </div>
      <div class="details">
        <div class="row"><span class="label">العميل</span><span class="value">${batch.clients?.name}</span></div>
        <div class="row"><span class="label">المنتج</span><span class="value">${batch.products?.name}</span></div>
        <div class="row"><span class="label">الكمية</span><span class="value">${batch.quantity_original} ${batch.unit === 'KG' ? 'كجم' : 'طن'}</span></div>
        <div class="row"><span class="label">التاريخ</span><span class="value">${new Date(batch.created_at).toLocaleString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span></div>
        <div class="row"><span class="label">الحالة</span><span class="value">نشطة ✓</span></div>
      </div>
      <div class="footer">
        تم الإنشاء بواسطة COLDSTORE System<br/>
        ${new Date().toLocaleString('ar-EG')}
      </div>
      </body></html>
    `)
    printWin.document.close()
    printWin.focus()
    setTimeout(() => { printWin.print() }, 500)
  }

  return (
    <Modal title="✅ تم تسجيل الشحنة" onClose={onClose} footer={
      <>
        <button className="btn btn-secondary" onClick={onClose}>إغلاق</button>
        <button className="btn btn-primary" onClick={handlePrint}>🖨️ طباعة البطاقة</button>
      </>
    }>
      <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 900, color: 'var(--accent)', letterSpacing: 4, marginBottom: 16, border: '2px solid var(--border)', padding: '10px 20px', borderRadius: 8, display: 'inline-block' }}>
          {batch.code}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)', padding: 16 }}>
          {[
            ['العميل', batch.clients?.name],
            ['المنتج', batch.products?.name],
            ['الكمية', `${batch.quantity_original} ${batch.unit === 'KG' ? 'كجم' : 'طن'}`],
            ['التاريخ', new Date(batch.created_at).toLocaleString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-3)' }}>{k}</span>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
