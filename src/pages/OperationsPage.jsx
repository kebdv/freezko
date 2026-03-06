import { useEffect, useState } from 'react'
import { getClients, getProducts, getClientActiveBatches, createBatch, getBatches } from '../services/api'
import Modal from '../components/Modal'
import OutConfirmModal from '../components/OutConfirmModal'
import Barcode from '../components/Barcode'
import { useLanguage } from '../LanguageContext'

const emptyInForm = { client_id: '', product_id: '', quantity: '', unit: 'KG', notes: '' }

export default function OperationsPage() {
  const { t } = useLanguage()
  const [clients, setClients] = useState([])
  const [products, setProducts] = useState([])
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('IN')
  const [inForm, setInForm] = useState(emptyInForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [newBatch, setNewBatch] = useState(null)
  const [showPrint, setShowPrint] = useState(false)
  const [outClientId, setOutClientId] = useState('')
  const [clientBatches, setClientBatches] = useState([])
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [outQty, setOutQty] = useState('')
  const [outNotes, setOutNotes] = useState('')
  const [outError, setOutError] = useState('')
  const [showOutConfirm, setShowOutConfirm] = useState(false)

  async function load() {
    const [c, p, b] = await Promise.all([getClients(), getProducts(), getBatches()])
    setClients(c.data || []); setProducts(p.data || []); setBatches(b.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleClientChange(clientId) {
    setOutClientId(clientId); setSelectedBatch(null); setOutQty(''); setOutError('')
    if (clientId) {
      const { data } = await getClientActiveBatches(clientId)
      setClientBatches(data || [])
    } else { setClientBatches([]) }
  }

  async function handleInSubmit(e) {
    e.preventDefault()
    if (!inForm.client_id || !inForm.product_id || !inForm.quantity) { setError(t.allFieldsRequired); return }
    setSaving(true); setError('')
    const { data, error } = await createBatch(inForm)
    if (error) { setError(error.message); setSaving(false); return }
    setNewBatch(data); setInForm(emptyInForm); setShowPrint(true); setSaving(false); load()
  }

  function handleOutConfirm() {
    if (!selectedBatch) { setOutError(t.batchRequired); return }
    if (!outQty || parseFloat(outQty) <= 0) { setOutError(t.enterQty); return }
    if (parseFloat(outQty) > selectedBatch.quantity_remaining) {
      setOutError(`${t.qtyTooLarge}: ${selectedBatch.quantity_remaining} ${selectedBatch.unit === 'KG' ? t.kg : t.ton}`); return
    }
    setOutError(''); setShowOutConfirm(true)
  }

  function handleOutSuccess() {
    setShowOutConfirm(false); setOutClientId(''); setClientBatches([])
    setSelectedBatch(null); setOutQty(''); setOutNotes(''); load()
  }

  const statusBadge = (status) => {
    const map = {
      ACTIVE:  [t.statusActive,  'var(--accent-2)', 'rgba(0,212,170,0.15)'],
      PARTIAL: [t.statusPartial, 'var(--warning)',  'rgba(255,170,0,0.15)'],
      CLOSED:  [t.statusClosed,  'var(--text-3)',   'rgba(255,255,255,0.07)'],
    }
    const [label, color, bg] = map[status] || map.ACTIVE
    return <span style={{ background: bg, color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{label}</span>
  }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.operations}</h1>
          <p className="page-subtitle">{t.operationsSubtitle}</p>
        </div>
      </div>

      {/* IN / OUT toggle */}
      <div className="ops-toggle">
        {['IN', 'OUT'].map(m => (
          <button key={m}
            onClick={() => { setMode(m); setError(''); setOutError('') }}
            className={`ops-toggle-btn ${mode === m ? (m === 'IN' ? 'ops-toggle-in' : 'ops-toggle-out') : ''}`}>
            {m === 'IN' ? t.inMode : t.outMode}
          </button>
        ))}
      </div>

      {/* ── Main layout: form left, recent batches right ── */}
      <div className="ops-layout">

        {/* ── IN FORM ── */}
        {mode === 'IN' && (
          <div className="ops-form-col">
            <div className="card">
              <div className="ops-banner ops-banner-in">📥 {t.inDesc}</div>
              {error && <div className="alert alert-error">{error}</div>}
              <form onSubmit={handleInSubmit} className="ops-form-fields">

                <div className="form-group">
                  <label>{t.client} *</label>
                  <select value={inForm.client_id} onChange={e => setInForm(f => ({ ...f, client_id: e.target.value }))}>
                    <option value="">{t.selectClient}</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>{t.product} *</label>
                  <select value={inForm.product_id} onChange={e => setInForm(f => ({ ...f, product_id: e.target.value }))}>
                    <option value="">{t.selectProduct}</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                {/* Quantity + Unit side by side */}
                <div className="ops-qty-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>{t.quantity} *</label>
                    <input
                      type="number" min="0.1" step="0.1"
                      placeholder="0.00"
                      value={inForm.quantity}
                      onChange={e => setInForm(f => ({ ...f, quantity: e.target.value }))}
                      style={{ fontSize: 18, fontWeight: 700 }}
                    />
                  </div>
                  <div className="form-group ops-unit-col">
                    <label>{t.unit}</label>
                    <select value={inForm.unit} onChange={e => setInForm(f => ({ ...f, unit: e.target.value }))}>
                      <option value="KG">{t.kg}</option>
                      <option value="TON">{t.ton}</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>{t.notes} <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>({t.optional})</span></label>
                  <textarea
                    placeholder={t.notesOptional} rows={2}
                    value={inForm.notes}
                    onChange={e => setInForm(f => ({ ...f, notes: e.target.value }))}
                    style={{ resize: 'none' }}
                  />
                </div>

                <button type="submit" disabled={saving} className="btn ops-submit-btn ops-submit-in">
                  {saving
                    ? <><div className="spinner" style={{ width: 18, height: 18 }} /> {t.processingDots}</>
                    : t.registerIn}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── OUT FORM ── */}
        {mode === 'OUT' && (
          <div className="ops-form-col">
            <div className="card">
              <div className="ops-banner ops-banner-out">📤 {t.outDesc}</div>
              {outError && <div className="alert alert-error">{outError}</div>}

              <div className="ops-form-fields">
                {/* Step 1 — Client */}
                <div className="ops-step">
                  <div className="ops-step-label">1</div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>{t.client} *</label>
                    <select value={outClientId} onChange={e => handleClientChange(e.target.value)}>
                      <option value="">{t.selectClient}</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Step 2 — Batch selection */}
                {outClientId && (
                  <div className="ops-step">
                    <div className="ops-step-label" style={{ background: selectedBatch ? 'var(--warning)' : 'var(--bg-3)', color: selectedBatch ? '#000' : 'var(--text-3)' }}>2</div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', display: 'block', marginBottom: 8 }}>{t.selectBatch}</label>
                      {clientBatches.length === 0 ? (
                        <div style={{ padding: '14px', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)', color: 'var(--text-3)', fontSize: 13, textAlign: 'center' }}>
                          {t.noBatches}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {clientBatches.map(b => (
                            <div key={b.id}
                              onClick={() => { setSelectedBatch(b); setOutQty(''); setOutError('') }}
                              style={{
                                padding: '12px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                                border: `2px solid ${selectedBatch?.id === b.id ? 'var(--warning)' : 'var(--border)'}`,
                                background: selectedBatch?.id === b.id ? 'rgba(255,170,0,0.08)' : 'var(--bg-3)',
                                transition: 'all 0.15s',
                              }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 900, color: 'var(--accent)', letterSpacing: 1 }}>{b.code}</span>
                                {statusBadge(b.status)}
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{b.products?.name}</span>
                                <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-2)' }}>
                                  {b.quantity_remaining} {b.unit === 'KG' ? t.kg : t.ton}
                                </span>
                              </div>
                              {/* Mini progress bar */}
                              <div style={{ marginTop: 8, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                                <div style={{
                                  height: '100%',
                                  width: `${Math.round((b.quantity_remaining / b.quantity_original) * 100)}%`,
                                  background: 'var(--warning)', borderRadius: 2,
                                }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3 — Quantity + Notes */}
                {selectedBatch && (
                  <div className="ops-step">
                    <div className="ops-step-label" style={{ background: outQty ? 'var(--accent-2)' : 'var(--bg-3)', color: outQty ? '#000' : 'var(--text-3)' }}>3</div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div className="ops-qty-row">
                        <div className="form-group" style={{ flex: 1 }}>
                          <label>{t.outQtyLabel}</label>
                          <input
                            type="number" min="0.1" step="0.1"
                            max={selectedBatch.quantity_remaining}
                            placeholder={`max: ${selectedBatch.quantity_remaining}`}
                            value={outQty}
                            onChange={e => setOutQty(e.target.value)}
                            style={{ fontSize: 18, fontWeight: 700 }}
                          />
                        </div>
                        <div className="form-group ops-unit-col">
                          <label>{t.unit}</label>
                          <input type="text" value={selectedBatch.unit === 'KG' ? t.kg : t.ton} disabled style={{ opacity: 0.5 }} />
                        </div>
                      </div>

                      {/* Live remaining preview */}
                      {outQty && parseFloat(outQty) > 0 && parseFloat(outQty) <= selectedBatch.quantity_remaining && (
                        <div style={{
                          padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                          background: 'rgba(59,158,255,0.08)', border: '1px solid rgba(59,158,255,0.2)',
                          fontSize: 13,
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ color: 'var(--text-3)' }}>{t.remainingAfter}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)' }}>
                              {(selectedBatch.quantity_remaining - parseFloat(outQty)).toFixed(2)} {selectedBatch.unit === 'KG' ? t.kg : t.ton}
                            </span>
                          </div>
                          <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', borderRadius: 2, transition: 'width 0.3s',
                              width: `${((selectedBatch.quantity_remaining - parseFloat(outQty)) / selectedBatch.quantity_original) * 100}%`,
                              background: 'var(--accent)',
                            }} />
                          </div>
                        </div>
                      )}

                      <div className="form-group">
                        <label>{t.notes} <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>({t.optional})</span></label>
                        <input
                          type="text"
                          placeholder={t.outNotesPlaceholder}
                          value={outNotes}
                          onChange={e => setOutNotes(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleOutConfirm}
                  disabled={!selectedBatch || !outQty}
                  className="btn ops-submit-btn ops-submit-out"
                  style={{ opacity: (!selectedBatch || !outQty) ? 0.45 : 1 }}
                >
                  {t.confirmOut}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── RECENT BATCHES ── */}
        <div className="ops-list-col">
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)', marginBottom: 14 }}>
            {t.recentBatches}
          </h3>

          {/* Mobile: cards */}
          <div className="ops-batch-cards">
            {batches.slice(0, 15).map(b => (
              <div key={b.id} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '12px 14px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 900, color: 'var(--accent)', letterSpacing: 1 }}>{b.code}</span>
                  {statusBadge(b.status)}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{b.clients?.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-3)' }}>
                  <span>{b.products?.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>
                    {b.quantity_remaining}/{b.quantity_original} {b.unit === 'KG' ? t.kg : t.ton}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="ops-batch-table">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>{t.batchCode}</th>
                    <th>{t.client}</th>
                    <th>{t.product}</th>
                    <th>{t.original}</th>
                    <th>{t.remaining}</th>
                    <th>{t.status}</th>
                    <th>{t.date}</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.slice(0, 20).map(b => (
                    <tr key={b.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>{b.code}</td>
                      <td style={{ color: 'var(--text)', fontWeight: 500 }}>{b.clients?.name}</td>
                      <td>{b.products?.name}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{b.quantity_original} {b.unit === 'KG' ? t.kg : t.ton}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: b.quantity_remaining === 0 ? 'var(--text-3)' : 'var(--text)' }}>
                        {b.quantity_remaining} {b.unit === 'KG' ? t.kg : t.ton}
                      </td>
                      <td>{statusBadge(b.status)}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                        {new Date(b.created_at).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                  {batches.length === 0 && (
                    <tr><td colSpan={7}><div className="empty-state"><div className="icon">⇅</div><p>{t.noData}</p></div></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showPrint && newBatch && (
        <PrintBatchModal batch={newBatch} t={t} onClose={() => { setShowPrint(false); setNewBatch(null) }} />
      )}
      {showOutConfirm && selectedBatch && (
        <OutConfirmModal
          batch={selectedBatch} quantity={parseFloat(outQty)} notes={outNotes}
          onClose={() => setShowOutConfirm(false)}
          onSuccess={handleOutSuccess}
          onKeepData={() => setShowOutConfirm(false)}
        />
      )}

      <style>{`
        /* ── Toggle ── */
        .ops-toggle {
          display: flex;
          background: var(--bg-3);
          border-radius: var(--radius-sm);
          padding: 4px;
          margin-bottom: 24px;
          border: 1px solid var(--border);
          width: 100%;
          max-width: 440px;
        }
        .ops-toggle-btn {
          flex: 1;
          padding: 13px 10px;
          border: none;
          cursor: pointer;
          border-radius: calc(var(--radius-sm) - 2px);
          font-family: var(--font);
          font-size: 15px;
          font-weight: 700;
          transition: all 0.18s;
          background: transparent;
          color: var(--text-3);
          white-space: nowrap;
        }
        .ops-toggle-in  { background: var(--accent-2) !important; color: #000 !important; }
        .ops-toggle-out { background: var(--warning)  !important; color: #000 !important; }

        /* ── Page layout: side-by-side on wide screens ── */
        .ops-layout {
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: 24px;
          align-items: start;
        }
        .ops-form-col, .ops-list-col { min-width: 0; }

        /* ── Form internals ── */
        .ops-form-fields { display: flex; flex-direction: column; gap: 18px; }

        .ops-banner {
          padding: 11px 14px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          margin-bottom: 20px;
          line-height: 1.5;
        }
        .ops-banner-in  { background: rgba(0,212,170,0.08); border: 1px solid rgba(0,212,170,0.2); color: var(--accent-2); }
        .ops-banner-out { background: rgba(255,170,0,0.08);  border: 1px solid rgba(255,170,0,0.2); color: var(--warning); }

        /* Qty + Unit row */
        .ops-qty-row { display: flex; gap: 10px; align-items: flex-end; }
        .ops-unit-col { width: 110px; flex-shrink: 0; }

        /* Step indicators (OUT) */
        .ops-step { display: flex; gap: 14px; align-items: flex-start; }
        .ops-step-label {
          width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
          background: var(--bg-3); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; color: var(--text-3);
          margin-top: 6px; transition: all 0.2s;
        }

        /* Submit buttons */
        .ops-submit-btn {
          width: 100%;
          justify-content: center;
          padding: 15px;
          font-size: 16px;
          font-weight: 700;
          margin-top: 6px;
          border-radius: var(--radius-sm);
          min-height: 52px;
        }
        .ops-submit-in  { background: var(--accent-2); color: #000; border: none; cursor: pointer; }
        .ops-submit-out { background: var(--warning);  color: #000; border: none; cursor: pointer; }
        .ops-submit-in:hover:not(:disabled)  { opacity: 0.88; }
        .ops-submit-out:hover:not(:disabled) { opacity: 0.88; }

        /* Recent batches section */
        .ops-batch-cards { display: none; flex-direction: column; gap: 10px; }
        .ops-batch-table { display: block; }

        /* ── Tablet (960px): stack form above table ── */
        @media (max-width: 960px) {
          .ops-layout { grid-template-columns: 1fr; }
        }

        /* ── Mobile (640px): cards instead of table, full-width toggle ── */
        @media (max-width: 640px) {
          .ops-toggle { max-width: 100%; }
          .ops-toggle-btn { font-size: 14px; padding: 13px 6px; }

          .ops-batch-cards { display: flex; }
          .ops-batch-table { display: none; }

          .ops-unit-col { width: 88px; }
          .ops-step-label { width: 26px; height: 26px; font-size: 11px; }
          .ops-step { gap: 10px; }

          .ops-submit-btn { font-size: 15px; padding: 16px; min-height: 54px; }
          .ops-banner { font-size: 12px; }
        }

        /* ── Small phones (400px) ── */
        @media (max-width: 400px) {
          .ops-unit-col { width: 76px; }
          .ops-toggle-btn { font-size: 13px; }
          .ops-submit-btn { padding: 15px; font-size: 14px; }
        }
      `}</style>
    </div>
  )
}

/* ── Print Modal ── */
function PrintBatchModal({ batch, t, onClose }) {
  function handlePrint() {
    const printWin = window.open('', '_blank', 'width=450,height=680')
    function getBars(text) {
      const C128 = [[2,1,1,4,1,2],[2,1,2,4,1,1],[2,1,2,1,1,4],[2,1,2,1,4,1],[2,1,4,1,1,2],[2,1,4,1,2,1],[2,1,4,2,1,1],[2,3,1,1,1,2],[2,3,1,2,1,1],[2,3,2,1,1,1],[3,1,1,1,2,2],[3,1,1,2,2,1],[3,1,2,1,1,2],[3,1,2,2,1,1],[3,2,1,1,1,2],[3,2,1,1,2,1],[3,2,1,2,1,1],[3,2,2,1,1,1],[3,1,1,1,3,1],[3,1,3,1,1,1],[3,1,1,3,1,1],[2,1,1,3,2,1],[2,1,1,1,2,3],[2,1,1,1,3,2],[2,1,3,1,1,2],[2,1,3,2,1,1],[2,1,1,2,1,3],[2,1,1,3,1,2],[3,1,1,1,1,3],[2,1,3,1,2,1],[2,1,1,2,3,1],[2,3,1,1,2,1],[2,3,2,1,1,1],[3,1,1,2,1,2],[3,1,1,1,2,2],[3,2,1,1,1,2],[3,2,1,2,1,1],[3,2,2,1,1,1],[2,1,2,3,1,1],[2,1,1,2,2,2],[2,2,1,2,1,2],[1,1,2,2,1,3],[1,1,2,3,1,2],[1,2,3,1,1,2],[1,1,3,2,1,2],[1,2,3,2,1,1],[1,2,1,3,2,1],[1,3,2,1,1,2],[1,3,1,2,2,1],[1,3,2,2,1,1],[2,1,1,4,2,1],[2,1,1,1,4,2],[2,1,1,2,4,1],[2,1,4,2,1,1],[2,1,1,4,1,2],[2,1,2,4,1,1],[2,1,4,1,2,1],[2,1,4,1,1,2],[2,4,1,1,2,1],[2,4,1,2,1,1],[2,4,2,1,1,1],[2,1,2,1,4,1],[2,1,2,1,1,4],[2,1,1,4,1,2],[2,1,4,1,1,2],[2,4,1,1,1,2],[2,4,1,1,2,1],[3,1,1,1,4,1],[3,1,1,4,1,1],[3,1,4,1,1,1],[4,1,1,1,1,3],[4,1,1,3,1,1],[4,3,1,1,1,1],[1,1,4,2,1,2],[1,2,4,1,1,2],[1,2,4,2,1,1],[1,1,2,1,4,2],[1,1,2,4,1,2],[1,2,2,1,1,4],[1,2,2,4,1,1],[1,4,2,1,1,2],[1,4,2,2,1,1],[1,1,1,2,4,2],[1,1,1,4,2,2],[1,2,1,1,4,2],[1,2,1,4,1,2],[1,4,1,1,2,2],[1,4,1,2,2,1],[1,1,4,1,1,3],[1,1,4,3,1,1],[4,1,1,1,3,1],[4,1,1,3,1,1],[2,3,3,1,1,1,2]]
      const START_B = 104, STOP = 106
      let checksum = START_B, chars = []
      for (let i = 0; i < text.length; i++) { const code = text.charCodeAt(i) - 32; checksum += code*(i+1); chars.push(code) }
      const all = [START_B, ...chars, checksum%103, STOP]
      let cx = 0, bars = []
      all.forEach(c => { const p=C128[c]||C128[0]; p.forEach((w,i)=>{ bars.push({x:cx,w:w*2,bar:i%2===0}); cx+=w*2 }) })
      return { bars, total: cx }
    }
    const { bars, total } = getBars(batch.code)
    const svgBars = bars.filter(b=>b.bar).map(b=>`<rect x="${b.x}" y="0" width="${b.w}" height="70" fill="black"/>`).join('')
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="90" viewBox="0 0 ${total} 90"><rect width="${total}" height="90" fill="white"/>${svgBars}<text x="${total/2}" y="85" text-anchor="middle" font-size="12" font-family="Courier New" font-weight="bold" letter-spacing="4">${batch.code}</text></svg>`
    const b64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)))
    printWin.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Batch ${batch.code}</title>
      <style>body{font-family:Arial;margin:0;padding:20px;max-width:380px}.header{text-align:center;border-bottom:2px solid #000;padding-bottom:14px;margin-bottom:18px}.logo{font-size:32px}.company{font-size:22px;font-weight:900;letter-spacing:3px}.sub{font-size:11px;color:#666;letter-spacing:1px;margin-top:2px}.bc-wrap{text-align:center;margin:18px 0;padding:12px;border:1px solid #ddd;border-radius:6px}.bc-wrap img{max-width:100%}.details{border:1px solid #eee;border-radius:6px;overflow:hidden}.row{display:flex;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #f0f0f0;font-size:13px}.row:last-child{border-bottom:none}.lbl{color:#888}.val{font-weight:700;text-align:right}.footer{text-align:center;margin-top:18px;font-size:10px;color:#aaa;border-top:1px solid #eee;padding-top:10px}</style>
    </head><body>
      <div class="header"><div class="logo">❄</div><div class="company">COLDSTORE</div><div class="sub">COLD STORAGE FACILITY</div></div>
      <div class="bc-wrap"><img src="${b64}" /></div>
      <div class="details">
        <div class="row"><span class="lbl">Client / العميل</span><span class="val">${batch.clients?.name}</span></div>
        <div class="row"><span class="lbl">Product / المنتج</span><span class="val">${batch.products?.name}</span></div>
        <div class="row"><span class="lbl">Quantity / الكمية</span><span class="val">${batch.quantity_original} ${batch.unit}</span></div>
        <div class="row"><span class="lbl">Date / التاريخ</span><span class="val">${new Date(batch.created_at).toLocaleString([],{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}</span></div>
        <div class="row"><span class="lbl">Status / الحالة</span><span class="val" style="color:green">Active ✓ / نشطة ✓</span></div>
      </div>
      <div class="footer">Generated by COLDSTORE System — ${new Date().toLocaleString()}</div>
    </body></html>`)
    printWin.document.close()
    setTimeout(() => printWin.print(), 600)
  }

  return (
    <Modal title={t.batchRegistered} onClose={onClose} footer={
      <><button className="btn btn-secondary" onClick={onClose}>{t.close}</button>
        <button className="btn btn-primary" onClick={handlePrint}>{t.printCard}</button></>
    }>
      <div style={{ textAlign: 'center', padding: '4px 0 16px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 900, color: 'var(--accent)', letterSpacing: 4, marginBottom: 12, border: '2px solid var(--border)', padding: '10px 20px', borderRadius: 8, display: 'inline-block' }}>
          {batch.code}
        </div>
        <div style={{ background: '#fff', padding: '12px 8px 6px', borderRadius: 8, display: 'block', marginBottom: 16 }}>
          <Barcode value={batch.code} width={Math.min(280, window.innerWidth - 100)} height={65} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, textAlign: 'left', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)' }}>
          {[
            [t.client,   batch.clients?.name],
            [t.product,  batch.products?.name],
            [t.quantity, `${batch.quantity_original} ${batch.unit === 'KG' ? t.kg : t.ton}`],
            [t.date,     new Date(batch.created_at).toLocaleString([], {year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})],
          ].map(([k, v]) => (
            <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'10px 14px', borderBottom:'1px solid var(--border)', fontSize:13 }}>
              <span style={{ color:'var(--text-3)' }}>{k}</span>
              <span style={{ color:'var(--text)', fontWeight:600 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
