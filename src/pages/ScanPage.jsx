import { useState, useRef, useEffect, useCallback } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { getBatchByCode } from '../services/api'
import OutConfirmModal from '../components/OutConfirmModal'
import { useLanguage } from '../LanguageContext'

export default function ScanPage() {
  const { t } = useLanguage()
  const [scanInput, setScanInput]     = useState('')
  const [batch, setBatch]             = useState(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [outQty, setOutQty]           = useState('')
  const [outNotes, setOutNotes]       = useState('')
  const [outError, setOutError]       = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [cameraOpen, setCameraOpen]   = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [scanning, setScanning]       = useState(false)
  const [scanned, setScanned]         = useState(false)

  const inputRef  = useRef(null)
  const videoRef  = useRef(null)
  const readerRef = useRef(null)
  const lockedRef = useRef(false)

  useEffect(() => {
    inputRef.current?.focus()
    return () => stopCamera()
  }, [])

  // Callback ref — fires the instant <video> mounts in DOM
  const videoCallbackRef = useCallback((videoEl) => {
    if (!videoEl) return
    videoRef.current = videoEl
    startZxing(videoEl)
  }, [])

  async function startZxing(videoEl) {
    try {
      if (readerRef.current) {
        try { readerRef.current.reset() } catch (_) {}
        readerRef.current = null
      }

      const reader = new BrowserMultiFormatReader()
      readerRef.current = reader

      // Use native enumerateDevices — works on all browsers/versions
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = allDevices.filter(d => d.kind === 'videoinput')

      if (videoDevices.length === 0) {
        setCameraError('notfound')
        setCameraOpen(false)
        return
      }

      // Prefer back camera label, fallback to last device
      const backCam = videoDevices.find(d => /back|rear|environment/i.test(d.label))
        || videoDevices[videoDevices.length - 1]

      lockedRef.current = false
      setScanning(true)

      // Pass undefined if deviceId is empty string (happens before permissions granted)
      const deviceId = backCam.deviceId || undefined

      reader.decodeFromVideoDevice(deviceId, videoEl, (result, err) => {
        if (result && !lockedRef.current) {
          lockedRef.current = true
          handleScannedCode(result.getText())
        }
        // NotFoundException fires constantly when no barcode visible — ignore
      })

    } catch (err) {
      const name = err?.name || ''
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setCameraError('permission')
      } else if (name === 'NotFoundError') {
        setCameraError('notfound')
      } else if (location.protocol === 'http:' && location.hostname !== 'localhost') {
        setCameraError('https')
      } else {
        setCameraError('error:' + (err?.message || name))
      }
      setCameraOpen(false)
      setScanning(false)
    }
  }

  async function handleScannedCode(rawCode) {
    // Vibrate on scan
    if (navigator.vibrate) navigator.vibrate([80, 40, 80])

    // Flash green
    setScanned(true)
    setTimeout(() => setScanned(false), 700)

    stopCamera()
    await doSearch(rawCode)
  }

  function stopCamera() {
    if (readerRef.current) {
      try { readerRef.current.reset() } catch (_) {}
      readerRef.current = null
    }
    if (videoRef.current) {
      const stream = videoRef.current.srcObject
      if (stream) stream.getTracks().forEach(tr => tr.stop())
      videoRef.current.srcObject = null
      videoRef.current = null
    }
    setScanning(false)
    setCameraOpen(false)
  }

  function openCamera() {
    setCameraError('')
    setBatch(null)
    setError('')
    lockedRef.current = false
    setCameraOpen(true)
  }

  async function doSearch(code) {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    setLoading(true); setError(''); setBatch(null); setOutQty(''); setOutNotes('')

    const { data, error } = await getBatchByCode(trimmed)
    setLoading(false)

    if (error || !data) {
      setError(`${t.notFound} ${trimmed}`)
      setScanInput('')
      inputRef.current?.focus()
      return
    }
    if (data.status === 'CLOSED') {
      setError(`${t.batchClosed}: ${trimmed}`)
      setScanInput('')
      inputRef.current?.focus()
      return
    }
    setBatch(data)
    setScanInput('')
  }

  async function handleManualScan(e) {
    e.preventDefault()
    await doSearch(scanInput)
  }

  function handleConfirm() {
    if (!outQty || parseFloat(outQty) <= 0) { setOutError(t.enterQty); return }
    if (parseFloat(outQty) > batch.quantity_remaining) {
      setOutError(`${t.qtyTooLarge}: ${batch.quantity_remaining} ${batch.unit === 'KG' ? t.kg : t.ton}`)
      return
    }
    setOutError('')
    setShowConfirm(true)
  }

  function handleSuccess() {
    setShowConfirm(false); setBatch(null); setOutQty(''); setOutNotes('')
    setTimeout(() => inputRef.current?.focus(), 200)
  }

  const statusMap = {
    ACTIVE:  { label: t.statusActive,  color: 'var(--accent-2)', bg: 'rgba(0,212,170,0.12)' },
    PARTIAL: { label: t.statusPartial, color: 'var(--warning)',  bg: 'rgba(255,170,0,0.12)' },
    CLOSED:  { label: t.statusClosed,  color: 'var(--text-3)',   bg: 'rgba(255,255,255,0.06)' },
  }

  // Error messages
  const errorUI = {
    permission: {
      msg: '❌ تم رفض إذن الكاميرا',
      hint: <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.9, marginTop: 6 }}>
        <div>📱 <strong>iPhone:</strong> الإعدادات ← Safari ← الكاميرا ← سماح</div>
        <div>🤖 <strong>Android:</strong> 🔒 في العنوان ← الكاميرا ← سماح</div>
      </div>
    },
    notfound: { msg: '❌ لا توجد كاميرا على هذا الجهاز', hint: null },
    https:    { msg: '⚠️ الكاميرا تحتاج https://', hint: null },
  }
  const errKey = Object.keys(errorUI).find(k => cameraError === k) || (cameraError.startsWith('error:') ? 'generic' : null)
  const errDisplay = errKey === 'generic'
    ? { msg: cameraError.replace('error:', '⚠️ '), hint: null }
    : errorUI[errKey]

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">▣ {t.scanPageTitle}</h1>
          <p className="page-subtitle">{t.scanPageSubtitle}</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>

        {/* Open/Close button */}
        <div style={{ marginBottom: cameraError ? 12 : 16 }}>
          {!cameraOpen ? (
            <button onClick={openCamera} className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: 15, justifyContent: 'center' }}>
              📷 {t.openCamera}
            </button>
          ) : (
            <button onClick={stopCamera} className="btn btn-danger"
              style={{ width: '100%', padding: '12px', justifyContent: 'center' }}>
              ✕ {t.closeCamera}
            </button>
          )}
        </div>

        {/* Error block */}
        {errDisplay && (
          <div style={{
            marginBottom: 16, padding: '12px 14px',
            background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.3)',
            borderRadius: 'var(--radius-sm)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--danger)' }}>{errDisplay.msg}</div>
            {errDisplay.hint}
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 8 }}>↓ أو استخدم الإدخال اليدوي</div>
          </div>
        )}

        {/* Viewfinder */}
        {cameraOpen && (
          <div style={{
            position: 'relative', marginBottom: 16,
            borderRadius: 'var(--radius-sm)', overflow: 'hidden',
            background: '#000', aspectRatio: '4/3',
          }}>
            <video
              ref={videoCallbackRef}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              playsInline muted autoPlay
            />

            {/* Success flash */}
            {scanned && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 10,
                background: 'rgba(0,212,170,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ fontSize: 72 }}>✅</div>
              </div>
            )}

            {/* Aiming frame */}
            {!scanned && (
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: '76%', height: 100,
                  border: '2px solid rgba(255,255,255,0.6)',
                  borderRadius: 10,
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
                  position: 'relative',
                }}>
                  {/* Corner accents */}
                  {[
                    { top:-2, left:-2,   borderTop:'3px solid var(--accent-2)', borderLeft:'3px solid var(--accent-2)',   borderRadius:'6px 0 0 0' },
                    { top:-2, right:-2,  borderTop:'3px solid var(--accent-2)', borderRight:'3px solid var(--accent-2)',  borderRadius:'0 6px 0 0' },
                    { bottom:-2, left:-2,  borderBottom:'3px solid var(--accent-2)', borderLeft:'3px solid var(--accent-2)',  borderRadius:'0 0 0 6px' },
                    { bottom:-2, right:-2, borderBottom:'3px solid var(--accent-2)', borderRight:'3px solid var(--accent-2)', borderRadius:'0 0 6px 0' },
                  ].map((s,i) => <div key={i} style={{ position:'absolute', width:24, height:24, ...s }} />)}

                  {/* Animated scan line */}
                  <div style={{
                    position:'absolute', left:6, right:6, height:2,
                    background:'linear-gradient(90deg,transparent,var(--accent),transparent)',
                    animation:'scanLine 1.6s ease-in-out infinite',
                  }}/>
                </div>
              </div>
            )}

            {/* Status pill */}
            <div style={{ position:'absolute', bottom:10, left:0, right:0, textAlign:'center', pointerEvents:'none' }}>
              <span style={{
                background:'rgba(0,0,0,0.65)', borderRadius:20,
                color: scanning ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)',
                fontSize:12, padding:'4px 14px',
              }}>
                {scanning ? '🔍 جاري المسح التلقائي...' : 'جاري تهيئة الكاميرا...'}
              </span>
            </div>
          </div>
        )}

        {/* Divider */}
        <div style={{ display:'flex', alignItems:'center', gap:10, color:'var(--text-3)', fontSize:12, marginBottom:14 }}>
          <div style={{ flex:1, height:1, background:'var(--border)' }} />
          {t.orManual}
          <div style={{ flex:1, height:1, background:'var(--border)' }} />
        </div>

        {/* Manual input */}
        <form onSubmit={handleManualScan} style={{ display:'flex', gap:10 }}>
          <input
            ref={inputRef}
            value={scanInput}
            onChange={e => setScanInput(e.target.value.toUpperCase())}
            placeholder={t.scanInputPlaceholder}
            style={{ fontFamily:'var(--font-mono)', fontSize:16, fontWeight:700, letterSpacing:2, textAlign:'center', flex:1 }}
            autoComplete="off"
          />
          <button type="submit" disabled={loading || !scanInput.trim()} className="btn btn-primary"
            style={{ padding:'10px 16px', whiteSpace:'nowrap' }}>
            {loading ? <div className="spinner" style={{ width:16, height:16 }} /> : t.searchBtn}
          </button>
        </form>

        {error && <div className="alert alert-error" style={{ marginTop:12, marginBottom:0 }}>{error}</div>}
      </div>

      {/* Batch result */}
      {batch && (
        <div className="card" style={{ border:`1px solid ${statusMap[batch.status]?.color}40` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:22, fontWeight:900, color:'var(--accent)', letterSpacing:2 }}>
              {batch.code}
            </div>
            <span style={{ background:statusMap[batch.status]?.bg, color:statusMap[batch.status]?.color, padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700 }}>
              {statusMap[batch.status]?.label}
            </span>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
            {[
              [t.client,    batch.clients?.name],
              [t.product,   batch.products?.name],
              [t.original,  `${batch.quantity_original} ${batch.unit==='KG'?t.kg:t.ton}`],
              [t.remaining, `${batch.quantity_remaining} ${batch.unit==='KG'?t.kg:t.ton}`],
            ].map(([k,v]) => (
              <div key={k} style={{ background:'var(--bg-3)', padding:'10px 12px', borderRadius:'var(--radius-sm)' }}>
                <div style={{ fontSize:11, color:'var(--text-3)', marginBottom:4 }}>{k}</div>
                <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-3)', marginBottom:6 }}>
              <span>{t.progressRemaining}</span>
              <span>{Math.round((batch.quantity_remaining/batch.quantity_original)*100)}%</span>
            </div>
            <div style={{ height:8, background:'var(--border)', borderRadius:4, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${(batch.quantity_remaining/batch.quantity_original)*100}%`, background:'var(--accent-2)', borderRadius:4 }} />
            </div>
          </div>

          {outError && <div className="alert alert-error">{outError}</div>}

          <div style={{ display:'grid', gridTemplateColumns:'1fr 80px', gap:10, marginBottom:12 }}>
            <div className="form-group">
              <label>{t.outQtyLabel}</label>
              <input type="number" min="0.1" step="0.1" max={batch.quantity_remaining}
                placeholder={`max: ${batch.quantity_remaining}`}
                value={outQty} onChange={e => setOutQty(e.target.value)} style={{ fontSize:16 }} />
            </div>
            <div className="form-group">
              <label>{t.unit}</label>
              <input type="text" value={batch.unit==='KG'?t.kg:t.ton} disabled style={{ opacity:0.5 }} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom:16 }}>
            <label>{t.notes}</label>
            <input type="text" placeholder={t.outNotesPlaceholder} value={outNotes} onChange={e => setOutNotes(e.target.value)} />
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => { setBatch(null); setScanInput(''); setTimeout(()=>inputRef.current?.focus(),100) }}
              className="btn btn-secondary" style={{ flex:1 }}>{t.scanAnother}</button>
            <button onClick={handleConfirm} disabled={!outQty}
              className="btn" style={{ flex:2, background:'var(--warning)', color:'#000', fontWeight:700, justifyContent:'center', opacity:!outQty?0.5:1 }}>
              📤 {t.confirmOut}
            </button>
          </div>
        </div>
      )}

      {showConfirm && batch && (
        <OutConfirmModal batch={batch} quantity={parseFloat(outQty)} notes={outNotes}
          onClose={() => setShowConfirm(false)} onSuccess={handleSuccess} onKeepData={() => setShowConfirm(false)} />
      )}

      <style>{`
        @keyframes scanLine {
          0%   { top: 4px; }
          50%  { top: calc(100% - 6px); }
          100% { top: 4px; }
        }
      `}</style>
    </div>
  )
}
