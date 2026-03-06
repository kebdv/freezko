import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getClients, getClientTransactions, getProducts } from '../services/api'
import { useLanguage } from '../LanguageContext'

export default function ClientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, isRTL } = useLanguage()
  const [client, setClient] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ product_id: '', date_from: '', date_to: '' })

  async function load() {
    const [cr, pr] = await Promise.all([getClients(), getProducts()])
    setClient(cr.data?.find(c => c.id === id) || null)
    setProducts(pr.data || [])
    await loadTx({})
    setLoading(false)
  }

  async function loadTx(f) {
    const { data } = await getClientTransactions(id, f)
    setTransactions(data || [])
  }

  useEffect(() => { load() }, [id])

  function handlePdfExport() {
    const printWin = window.open('', '_blank', 'width=800,height=700')
    const rows = transactions.map(tx => `
      <tr>
        <td>${tx.type === 'IN' ? t.typeIn : t.typeOut}</td>
        <td>${tx.products?.name||'—'}</td><td>${tx.batches?.code||'—'}</td>
        <td>${tx.quantity} ${tx.unit}</td>
        <td>${new Date(tx.created_at).toLocaleString([],{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}</td>
        <td>${tx.notes||'—'}</td>
      </tr>`).join('')
    printWin.document.write(`<!DOCTYPE html><html dir="${isRTL?'rtl':'ltr'}"><head><meta charset="UTF-8"><title>${t.statementTitle} - ${client?.name}</title>
      <style>body{font-family:Arial;margin:20px;font-size:13px}h1{font-size:20px;margin-bottom:4px}.sub{color:#888;margin-bottom:20px;font-size:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px 10px;text-align:${isRTL?'right':'left'}}th{background:#f5f5f5;font-weight:700}.footer{margin-top:20px;font-size:11px;color:#aaa;text-align:center}</style>
    </head><body>
      <h1>❄ COLDSTORE — ${t.statementTitle}</h1>
      <p class="sub">${t.statementClient}: <strong>${client?.name}</strong> | ${t.statementPhone}: ${client?.phone||'—'} | ${t.statementPrinted}: ${new Date().toLocaleString()}</p>
      <table><thead><tr><th>${t.typeIn.replace('↓ ','')}</th><th>${t.product}</th><th>${t.batchCode}</th><th>${t.quantity}</th><th>${t.dateTime}</th><th>${t.notes}</th></tr></thead><tbody>${rows}</tbody></table>
      <p class="footer">${t.statementTotal}: ${transactions.length} | ${t.statementFooter}</p>
    </body></html>`)
    printWin.document.close()
    setTimeout(() => printWin.print(), 400)
  }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>
  if (!client) return <div style={{ textAlign:'center',padding:60,color:'var(--text-3)' }}>Not found</div>

  const totalIn = transactions.filter(tx=>tx.type==='IN').reduce((s,tx)=>s+tx.quantity,0)
  const totalOut = transactions.filter(tx=>tx.type==='OUT').reduce((s,tx)=>s+tx.quantity,0)

  return (
    <div>
      <div className="page-header">
        <div style={{ display:'flex',alignItems:'center',gap:12 }}>
          <button onClick={() => navigate('/clients')} style={{ background:'none',border:'none',color:'var(--text-3)',cursor:'pointer',fontSize:22,padding:4 }}>{isRTL?'→':'←'}</button>
          <div><h1 className="page-title">{client.name}</h1><p className="page-subtitle">{client.phone||t.noPhone}{client.notes?` — ${client.notes}`:''}</p></div>
        </div>
        <button className="btn btn-secondary" onClick={handlePdfExport}>🖨️ {t.exportPdf}</button>
      </div>

      <div className="grid-3" style={{ marginBottom:24 }}>
        {[[t.totalOps,transactions.length,'var(--accent)'],[t.totalIn,`${totalIn.toLocaleString()} ${t.units}`,'var(--accent-2)'],[t.totalOut,`${totalOut.toLocaleString()} ${t.units}`,'var(--warning)']].map(([label,value,color])=>(
          <div key={label} className="card" style={{ padding:18 }}>
            <div style={{ fontFamily:'var(--font-mono)',fontSize:20,fontWeight:700,color }}>{value}</div>
            <div style={{ fontSize:12,color:'var(--text-3)',marginTop:6 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom:20,padding:16 }}>
        <div style={{ display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end' }}>
          <div className="form-group" style={{ minWidth:160,flex:1 }}>
            <label>{t.product}</label>
            <select value={filters.product_id} onChange={e=>setFilters(f=>({...f,product_id:e.target.value}))}>
              <option value="">{t.allProducts}</option>
              {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ minWidth:140 }}><label>{t.fromDate}</label><input type="date" value={filters.date_from} onChange={e=>setFilters(f=>({...f,date_from:e.target.value}))} /></div>
          <div className="form-group" style={{ minWidth:140 }}><label>{t.toDate}</label><input type="date" value={filters.date_to} onChange={e=>setFilters(f=>({...f,date_to:e.target.value}))} /></div>
          <button className="btn btn-primary" onClick={()=>loadTx(filters)}>{t.applyFilter}</button>
          <button className="btn btn-secondary" onClick={()=>{const e={product_id:'',date_from:'',date_to:''};setFilters(e);loadTx(e)}}>{t.resetFilter}</button>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="mobile-cards">
        {transactions.map(tx=>(
          <div key={tx.id} className="mobile-card">
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6 }}>
              <span className={`badge badge-${tx.type.toLowerCase()}`}>{tx.type==='IN'?t.typeIn:t.typeOut}</span>
              <span style={{ fontSize:11,color:'var(--text-3)' }}>{new Date(tx.created_at).toLocaleString([],{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}</span>
            </div>
            <div style={{ fontWeight:600,color:'var(--text)',marginBottom:2 }}>{tx.products?.name}</div>
            <div style={{ fontSize:12,color:'var(--text-3)',marginBottom:4 }}>{tx.batches?.code}</div>
            <div style={{ fontFamily:'var(--font-mono)',fontWeight:700,color:'var(--text)' }}>{tx.quantity} {tx.unit==='KG'?t.kg:t.ton}</div>
          </div>
        ))}
        {transactions.length===0&&<div className="empty-state"><div className="icon">📋</div><p>{t.noTransactions}</p></div>}
      </div>

      {/* Desktop table */}
      <div className="desktop-table">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>{t.status}</th><th>{t.product}</th><th>{t.batchCode}</th><th>{t.quantity}</th><th>{t.dateTime}</th><th>{t.notes}</th></tr></thead>
            <tbody>
              {transactions.length===0?(
                <tr><td colSpan={6}><div className="empty-state"><div className="icon">📋</div><p>{t.noTransactions}</p></div></td></tr>
              ):transactions.map(tx=>(
                <tr key={tx.id}>
                  <td><span className={`badge badge-${tx.type.toLowerCase()}`}>{tx.type==='IN'?t.typeIn:t.typeOut}</span></td>
                  <td style={{ color:'var(--text)',fontWeight:500 }}>{tx.products?.name}</td>
                  <td style={{ fontFamily:'var(--font-mono)',fontSize:12,color:'var(--accent)' }}>{tx.batches?.code||'—'}</td>
                  <td style={{ fontFamily:'var(--font-mono)',fontWeight:600 }}>{tx.quantity} {tx.unit==='KG'?t.kg:t.ton}</td>
                  <td style={{ fontSize:12,color:'var(--text-3)' }}>{new Date(tx.created_at).toLocaleString([],{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}</td>
                  <td style={{ fontSize:12,color:'var(--text-3)' }}>{tx.notes||'—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
