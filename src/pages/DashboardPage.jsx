import { useEffect, useState } from 'react'
import { getDashboardStats } from '../services/api'
import { supabase } from '../supabaseClient'
import { useLanguage } from '../LanguageContext'

function StatCard({ icon, label, value, accent, subtitle }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, position: 'relative', overflow: 'hidden', transition: 'border-color 0.2s, transform 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}>
      <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: `radial-gradient(circle, ${accent}20 0%, transparent 70%)` }} />
      <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 34, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 8, fontWeight: 500 }}>{label}</div>
      {subtitle && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{subtitle}</div>}
    </div>
  )
}

export default function DashboardPage() {
  const { t } = useLanguage()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    const s = await getDashboardStats()
    setStats(s); setLoading(false)
  }

  useEffect(() => {
    load()
    const channel = supabase.channel('dashboard-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'storage_operations' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'batches' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, load)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  const inventoryDisplay = stats.totalInventoryKg >= 1000
    ? `${(stats.totalInventoryKg / 1000).toFixed(2)} ${t.ton}`
    : `${stats.totalInventoryKg.toFixed(0)} ${t.kg}`

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t.dashboard}</h1>
          <p className="page-subtitle">{t.dashboardSubtitle}</p>
        </div>
        <div style={{ fontSize: 12, color: 'var(--accent-2)', background: 'rgba(0,212,170,0.1)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(0,212,170,0.2)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-2)', display: 'inline-block', animation: 'pulse2 1.5s ease infinite' }} />
          {t.live}
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 28 }}>
        <StatCard icon="👥" label={t.totalClients} value={stats.totalClients} accent="var(--accent)" subtitle={t.registeredClients} />
        <StatCard icon="📦" label={t.currentInventory} value={inventoryDisplay} accent="var(--accent-2)" subtitle={t.activeBatchesStock} />
        <StatCard icon="📋" label={t.todayOps} value={stats.todayOps} accent="var(--warning)" subtitle={t.inOutToday} />
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)', marginBottom: 16 }}>{t.activeBatches}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 40, fontFamily: 'var(--font-mono)', fontWeight: 900, color: 'var(--accent-2)' }}>{stats.activeBatches}</div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{t.activeBatchesDesc}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>{t.readyAnytime}</div>
            </div>
          </div>
        </div>
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)', marginBottom: 16 }}>{t.quickLinks}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: t.registerIncoming, path: '/operations', badge: 'IN', color: 'var(--accent-2)' },
              { label: t.registerOutgoing, path: '/operations', badge: 'OUT', color: 'var(--warning)' },
              { label: t.viewInventory, path: '/inventory', badge: '→', color: 'var(--accent)' },
            ].map(item => (
              <a key={item.badge} href={item.path} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-3)', textDecoration: 'none', color: 'var(--text-2)', fontSize: 13, border: '1px solid var(--border)', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = item.color; e.currentTarget.style.color = 'var(--text)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' }}>
                {item.label}
                <span style={{ background: item.color + '22', color: item.color, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{item.badge}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes pulse2 { 0%,100% { opacity:1 } 50% { opacity:0.3 } }`}</style>
    </div>
  )
}
