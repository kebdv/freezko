import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useLanguage } from '../LanguageContext'

export default function LoginPage() {
  const { t, isRTL, toggleLanguage, lang } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, position: 'relative', overflow: 'hidden',
    }}>
      {/* Grid bg */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '50px 50px', opacity: 0.4 }} />
      <div style={{ position: 'absolute', top: '20%', left: '30%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(59,158,255,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '20%', right: '25%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(0,212,170,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Lang toggle top corner */}
      <div style={{ position: 'absolute', top: 20, right: isRTL ? 'auto' : 20, left: isRTL ? 20 : 'auto', zIndex: 10 }}>
        <button onClick={toggleLanguage} style={{
          background: 'var(--bg-3)', border: '1px solid var(--border)',
          color: 'var(--accent)', borderRadius: 'var(--radius-sm)',
          padding: '7px 14px', fontSize: 12, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'var(--font)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>🌐 {t.switchLanguage}</button>
      </div>

      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px', boxShadow: '0 0 40px var(--accent-glow)' }}>❄</div>
          <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>COLDSTORE</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{t.appSubtitle}</p>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 32, boxShadow: 'var(--shadow)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24 }}>{t.signInTo}</h2>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label>{t.email}</label>
              <input type="email" placeholder={t.emailPlaceholder} value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
            </div>
            <div className="form-group">
              <label>{t.password}</label>
              <input type="password" placeholder={t.passwordPlaceholder} value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 8 }}>
              {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> {t.signingIn}</> : t.signIn}
            </button>
          </form>
        </div>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-3)' }}>{t.contactAdmin}</p>
      </div>
    </div>
  )
}
