import { useState, useEffect, useRef } from 'react'
import { processBatchOut } from '../services/api'
import Modal from './Modal'
import { useLanguage } from '../LanguageContext'

const TIMEOUT_SECONDS = 60

export default function OutConfirmModal({ batch, quantity, notes, onClose, onSuccess, onKeepData }) {
  const { t } = useLanguage()
  const [phase, setPhase] = useState('confirm')
  const [scanInput, setScanInput] = useState('')
  const [timeLeft, setTimeLeft] = useState(TIMEOUT_SECONDS)
  const [processing, setProcessing] = useState(false)
  const [scanError, setScanError] = useState('')
  const scanRef = useRef(null)
  const timerRef = useRef(null)

  const isPartial = quantity < batch.quantity_original
  const remaining = batch.quantity_remaining - quantity
  const unit = batch.unit === 'KG' ? t.kg : t.ton

  function startScanPhase() {
    setPhase('scan')
    setTimeout(() => scanRef.current?.focus(), 100)
    timerRef.current = setInterval(() => {
      setTimeLeft(tv => {
        if (tv <= 1) { clearInterval(timerRef.current); setPhase('timeout'); return 0 }
        return tv - 1
      })
    }, 1000)
  }

  useEffect(() => () => clearInterval(timerRef.current), [])

  async function handleScan(e) {
    e.preventDefault()
    if (!scanInput.trim()) return
    setScanError('')
    if (scanInput.trim().toUpperCase() !== batch.code.toUpperCase()) {
      setScanError(`❌ ${t.codeMismatch} ${batch.code}`)
      setScanInput(''); scanRef.current?.focus(); return
    }
    clearInterval(timerRef.current); setProcessing(true)
    const { error } = await processBatchOut({ batchId: batch.id, quantity, notes })
    if (error) { setScanError(error.message); setProcessing(false); return }
    setPhase('success')
    setTimeout(() => onSuccess(), 1800)
  }

  if (phase === 'confirm') return (
    <Modal title={t.confirmOutTitle} onClose={onClose} footer={
      <><button className="btn btn-secondary" onClick={onClose}>{t.cancel}</button>
        <button className="btn" onClick={startScanPhase} style={{ background:'var(--warning)',color:'#000',fontWeight:700 }}>{t.confirmAndScan}</button></>
    }>
      <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
        <div style={{ background:'var(--bg-3)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:16 }}>
          <div style={{ fontSize:12,color:'var(--text-3)',marginBottom:10,textTransform:'uppercase',letterSpacing:'0.08em' }}>{t.outDetails}</div>
          {[[t.client,batch.clients?.name],[t.product,batch.products?.name],[t.batchCode,batch.code],[t.outQtyLabel2,`${quantity} ${unit}`],
            ...(isPartial?[[t.originalQty,`${batch.quantity_original} ${unit}`],[t.remainingAfter,`${remaining} ${unit}`]]:[[t.status,t.fullOut]]),
            ...(notes?[[t.note,notes]]:[])
          ].map(([k,v])=>(
            <div key={k} style={{ display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--border)',fontSize:13 }}>
              <span style={{ color:'var(--text-3)' }}>{k}</span>
              <span style={{ color:k===t.batchCode?'var(--accent)':'var(--text)',fontWeight:600,fontFamily:k===t.batchCode?'var(--font-mono)':'inherit' }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ padding:'10px 14px',background:'rgba(255,170,0,0.08)',border:'1px solid rgba(255,170,0,0.25)',borderRadius:'var(--radius-sm)',fontSize:13,color:'var(--warning)' }}>
          {t.scanWarning}
        </div>
      </div>
    </Modal>
  )

  if (phase === 'scan') {
    const progress = (timeLeft / TIMEOUT_SECONDS) * 100
    const urgentColor = timeLeft <= 15 ? 'var(--danger)' : timeLeft <= 30 ? 'var(--warning)' : 'var(--accent-2)'
    return (
      <div className="modal-overlay">
        <div className="modal" style={{ maxWidth:440 }}>
          <div style={{ textAlign:'center',padding:'8px 0 20px' }}>
            <div style={{ fontSize:52,marginBottom:12 }}>📷</div>
            <h2 style={{ fontSize:20,fontWeight:700,marginBottom:8 }}>{t.scanTitle}</h2>
            <p style={{ color:'var(--text-3)',fontSize:13,marginBottom:20 }}>
              {t.scanDesc} <strong style={{ color:'var(--accent)',fontFamily:'var(--font-mono)' }}>{batch.code}</strong>
            </p>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:40,fontFamily:'var(--font-mono)',fontWeight:900,color:urgentColor,marginBottom:6 }}>
                {String(Math.floor(timeLeft/60)).padStart(2,'0')}:{String(timeLeft%60).padStart(2,'0')}
              </div>
              <div style={{ height:6,background:'var(--border)',borderRadius:3,overflow:'hidden' }}>
                <div style={{ height:'100%',width:`${progress}%`,background:urgentColor,borderRadius:3,transition:'width 1s linear,background 0.3s' }} />
              </div>
              <p style={{ fontSize:11,color:'var(--text-3)',marginTop:6 }}>{t.timeRemaining}</p>
            </div>
            {scanError && <div className="alert alert-error" style={{ textAlign:'left' }}>{scanError}</div>}
            <form onSubmit={handleScan}>
              <input ref={scanRef} value={scanInput} onChange={e=>setScanInput(e.target.value)} placeholder={t.scanPlaceholder}
                style={{ textAlign:'center',fontSize:16,fontFamily:'var(--font-mono)',fontWeight:700,letterSpacing:2,marginBottom:12 }} disabled={processing} />
              <button type="submit" disabled={processing||!scanInput.trim()} className="btn btn-success" style={{ width:'100%',justifyContent:'center',padding:'12px',fontWeight:700 }}>
                {processing?<><div className="spinner" style={{width:16,height:16}}/> {t.processingOp}</>:'✓ '+t.confirm}
              </button>
            </form>
            <button onClick={()=>{clearInterval(timerRef.current);onClose()}} style={{ marginTop:12,background:'none',border:'none',color:'var(--text-3)',cursor:'pointer',fontSize:13 }}>
              {t.cancelOp}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'success') return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth:360,textAlign:'center' }}>
        <div style={{ padding:'20px 0' }}>
          <div style={{ fontSize:60,marginBottom:16 }}>✅</div>
          <h2 style={{ fontSize:22,fontWeight:700,color:'var(--accent-2)',marginBottom:8 }}>{t.successTitle}</h2>
          <p style={{ color:'var(--text-3)',fontSize:14 }}>{t.successDesc} {quantity} {unit} {t.successFrom} {batch.code}</p>
        </div>
      </div>
    </div>
  )

  if (phase === 'timeout') return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth:420 }}>
        <div style={{ textAlign:'center',padding:'12px 0' }}>
          <div style={{ fontSize:52,marginBottom:12 }}>⏰</div>
          <h2 style={{ fontSize:20,fontWeight:700,color:'var(--danger)',marginBottom:8 }}>{t.timeoutTitle}</h2>
          <p style={{ color:'var(--text-2)',fontSize:14,marginBottom:20,lineHeight:1.6 }}>
            {t.timeoutDesc}<br/><strong style={{ color:'var(--text)' }}>{t.noOpRegistered}</strong> {t.dataKept}
          </p>
          <div style={{ padding:'12px 16px',background:'rgba(255,77,109,0.08)',border:'1px solid rgba(255,77,109,0.25)',borderRadius:'var(--radius-sm)',fontSize:13,color:'var(--danger)',marginBottom:20 }}>
            ❌ {t.timeoutBanner} <strong>{batch.code}</strong> {t.timeoutBanner2}
          </div>
          <button className="btn btn-primary" onClick={()=>{clearInterval(timerRef.current);onKeepData()}} style={{ width:'100%',justifyContent:'center',padding:'11px' }}>
            {t.retryBtn}
          </button>
        </div>
      </div>
    </div>
  )
}
