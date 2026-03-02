import { useEffect, useState } from 'react'
import { getDashboardStats } from '../services/api'

function StatCard({ icon, label, value, accent, subtitle }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = accent || 'var(--accent)'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 100, height: 100,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${accent || 'var(--accent)'}15 0%, transparent 70%)`,
      }} />
      <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 36, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text)', lineHeight: 1 }}>
        {value.toLocaleString()}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 8, fontWeight: 500 }}>{label}</div>
      {subtitle && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{subtitle}</div>}
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardStats().then(s => {
      setStats(s)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">لوحة المعلومات</h1>
          <p className="page-subtitle">نظرة عامة على مستودع التخزين البارد الخاص بك</p>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 32 }}>
        <StatCard
          icon="👥"
          label="إجمالي العملاء"
          value={stats.totalClients}
          accent="var(--accent)"
          subtitle="العملاء المسجلون"
        />
        <StatCard
          icon="📦"
          label="المخزون الحالي"
          value={stats.totalInventory}
          accent="var(--accent-2)"
          subtitle="الوحدات المخزنة"
        />
        <StatCard
          icon="📋"
          label="عمليات اليوم"
          value={stats.todayOps}
          accent="var(--warning)"
          subtitle="حركات الدخول والخروج اليوم"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid-2">
        <div className="card">
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)' }}>إجمالي الحجم</h3>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-2)' }}>
                {stats.totalIn.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>إجمالي الدخول</div>
            </div>
            <div style={{ width: 1, background: 'var(--border)' }} />
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--warning)' }}>
                {stats.totalOut.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>إجمالي الخروج</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)', marginBottom: 16 }}>روابط سريعة</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'تسجيل البضائع الواردة', path: '/operations', badge: 'دخول', color: 'var(--accent-2)' },
              { label: 'تسجيل البضائع الصادرة', path: '/operations', badge: 'خروج', color: 'var(--warning)' },
              { label: 'عرض المخزون', path: '/inventory', badge: '→', color: 'var(--accent)' },
            ].map(item => (
              <a
                key={item.badge}
                href={item.path}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-3)', textDecoration: 'none', color: 'var(--text-2)',
                  fontSize: 13, border: '1px solid var(--border)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = item.color; e.currentTarget.style.color = 'var(--text)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' }}
              >
                {item.label}
                <span style={{
                  background: item.color + '22', color: item.color,
                  padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                }}>{item.badge}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
