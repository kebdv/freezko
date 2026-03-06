import { useEffect, useState } from 'react'
import { useLanguage } from '../LanguageContext'

export default function WelcomePage({ user, onDone }) {
  const { t, isRTL } = useLanguage()
  const [phase, setPhase] = useState(0)
  const displayName = user.user_metadata?.full_name || user.email.split('@')[0]

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400)
    const t2 = setTimeout(() => setPhase(2), 1200)
    const t3 = setTimeout(() => setPhase(3), 2000)
    const t4 = setTimeout(() => onDone(), 3200)
    return () => [t1, t2, t3, t4].forEach(clearTimeout)
  }, [])

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{
      position: 'fixed', inset: 0, background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '60px 60px', opacity: 0.3 }} />
      <div style={{ position: 'absolute', width: 600, height: 600, background: 'radial-gradient(circle, rgba(59,158,255,0.1) 0%, transparent 65%)', pointerEvents: 'none' }} />

      <div style={{ opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? 'scale(1)' : 'scale(0.8)', transition: 'all 0.6s cubic-bezier(0.34,1.56,0.64,1)', marginBottom: 32, position: 'relative', zIndex: 1 }}>
        <div style={{ width: 90, height: 90, borderRadius: 24, background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, margin: '0 auto', boxShadow: '0 0 60px rgba(59,158,255,0.3)' }}>❄</div>
      </div>

      <div style={{ opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? 'translateY(0)' : 'translateY(16px)', transition: 'all 0.5s ease', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <p style={{ color: 'var(--text-3)', fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>{t.welcomeTo}</p>
        <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 700, background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 16 }}>COLDSTORE</h1>
        <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)' }}>
          {t.hello} <span style={{ color: 'var(--accent)' }}>{displayName}</span> 👋
        </div>
        <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 8 }}>
          {new Date().toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div style={{ opacity: phase >= 3 ? 1 : 0, transition: 'opacity 0.4s ease', marginTop: 48, position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 200, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent-2))', borderRadius: 2, animation: 'loadBar 1s ease forwards' }} />
        </div>
        <p style={{ color: 'var(--text-3)', fontSize: 12, letterSpacing: '0.08em' }}>{t.loadingData}</p>
      </div>

      <style>{`@keyframes loadBar { from { width: 0%; } to { width: 100%; } }`}</style>
    </div>
  )
}
