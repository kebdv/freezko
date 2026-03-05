import { useState, useRef, useEffect } from 'react'
import { getBatchByCode } from '../services/api'
import OutConfirmModal from '../components/OutConfirmModal'

export default function ScanPage() {
  const [scanInput, setScanInput] = useState('')
  const [batch, setBatch] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [outQty, setOutQty] = useState('')
  const [outNotes, setOutNotes] = useState('')
  const [outError, setOutError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  async function handleScan(e) {
    e.preventDefault()
    const code = scanInput.trim().toUpperCase()
    if (!code) return
    setLoading(true)
    setError('')
    setBatch(null)
    setOutQty('')
    setOutNotes('')

    const { data, error } = await getBatchByCode(code)
    setLoading(false)

    if (error || !data) {
      setError(`لم يتم العثور على شحنة بالكود: ${code}`)
      setScanInput('')
      inputRef.current?.focus()
      return
    }

    if (data.status === 'CLOSED') {
      setError(`الشحنة ${code} مقفلة — تم تفريغها بالكامل`)
      setScanInput('')
      inputRef.current?.focus()
      return
    }

    setBatch(data)
    setScanInput('')
  }

  function handleConfirm() {
    if (!outQty || parseFloat(outQty) <= 0) { setOutError('أدخل الكمية'); return }
    if (parseFloat(outQty) > batch.quantity_remaining) {
      setOutError(`الكمية أكبر من المتاح: ${batch.quantity_remaining} ${batch.unit === 'KG' ? 'كجم' : 'طن'}`); return
    }
    setOutError('')
    setShowConfirm(true)
  }

  function handleSuccess() {
    setShowConfirm(false)
    setBatch(null)
    setOutQty('')
    setOutNotes('')
    setTimeout(() => inputRef.current?.focus(), 200)
  }

  const statusMap = {
    ACTIVE: { label: 'نشطة', color: 'var(--accent-2)', bg: 'rgba(0,212,170,0.12)' },
    PARTIAL: { label: 'جزئية', color: 'var(--warning)', bg: 'rgba(255,170,0,0.12)' },
    CLOSED: { label: 'مقفلة', color: 'var(--text-3)', bg: 'rgba(255,255,255,0.06)' },
  }

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">▣ مسح الباركود</h1>
          <p className="page-subtitle">مسح الكود للخروج السريع</p>
        </div>
      </div>

      {/* Scan input */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📷</div>
          <p style={{ color: 'var(--text-2)', fontSize: 14 }}>وجّه الجهاز على الباركود أو اكتب الكود يدوياً</p>
        </div>
        <form onSubmit={handleScan} style={{ display: 'flex', gap: 10 }}>
          <input
            ref={inputRef}
            value={scanInput}
            onChange={e => setScanInput(e.target.value.toUpperCase())}
            placeholder="FRZ-000001"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, letterSpacing: 2, textAlign: 'center', flex: 1 }}
            autoComplete="off"
          />
          <button type="submit" disabled={loading || !scanInput.trim()} className="btn btn-primary" style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}>
            {loading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : '🔍 بحث'}
          </button>
        </form>
        {error && <div className="alert alert-error" style={{ marginTop: 12, marginBottom: 0 }}>{error}</div>}
      </div>

      {/* Batch info */}
      {batch && (
        <div className="card" style={{ border: `1px solid ${statusMap[batch.status]?.color}40` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 900, color: 'var(--accent)', letterSpacing: 2 }}>
              {batch.code}
            </div>
            <span style={{ background: statusMap[batch.status]?.bg, color: statusMap[batch.status]?.color, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
              {statusMap[batch.status]?.label}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[
              ['العميل', batch.clients?.name],
              ['المنتج', batch.products?.name],
              ['الكمية الأصلية', `${batch.quantity_original} ${batch.unit === 'KG' ? 'كجم' : 'طن'}`],
              ['المتبقي', `${batch.quantity_remaining} ${batch.unit === 'KG' ? 'كجم' : 'طن'}`],
            ].map(([k, v]) => (
              <div key={k} style={{ background: 'var(--bg-3)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>{k}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>
              <span>المتبقي</span>
              <span>{Math.round((batch.quantity_remaining / batch.quantity_original) * 100)}%</span>
            </div>
            <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(batch.quantity_remaining / batch.quantity_original) * 100}%`,
                background: 'var(--accent-2)', borderRadius: 4, transition: 'width 0.5s ease',
              }} />
            </div>
          </div>

          {outError && <div className="alert alert-error">{outError}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 10, marginBottom: 12 }}>
            <div className="form-group">
              <label>الكمية الخارجة *</label>
              <input type="number" min="0.1" step="0.1" max={batch.quantity_remaining}
                placeholder={`max: ${batch.quantity_remaining}`}
                value={outQty} onChange={e => setOutQty(e.target.value)} style={{ fontSize: 16 }} />
            </div>
            <div className="form-group">
              <label>الوحدة</label>
              <input type="text" value={batch.unit === 'KG' ? 'كجم' : 'طن'} disabled style={{ opacity: 0.5 }} />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label>ملاحظة</label>
            <input type="text" placeholder="سبب الخروج (اختياري)" value={outNotes} onChange={e => setOutNotes(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setBatch(null); setScanInput(''); setTimeout(() => inputRef.current?.focus(), 100) }}
              className="btn btn-secondary" style={{ flex: 1 }}>
              مسح آخر →
            </button>
            <button onClick={handleConfirm} disabled={!outQty}
              className="btn" style={{ flex: 2, background: 'var(--warning)', color: '#000', fontWeight: 700, justifyContent: 'center', opacity: !outQty ? 0.5 : 1 }}>
              📤 تأكيد الخروج
            </button>
          </div>
        </div>
      )}

      {showConfirm && batch && (
        <OutConfirmModal
          batch={batch}
          quantity={parseFloat(outQty)}
          notes={outNotes}
          onClose={() => setShowConfirm(false)}
          onSuccess={handleSuccess}
          onKeepData={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}
