import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        opacity: 0.4,
      }} />

      {/* Glow orbs */}
      <div style={{
        position: 'absolute', top: '20%', left: '30%',
        width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(59,158,255,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '20%', right: '25%',
        width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(0,212,170,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%', maxWidth: 400,
        position: 'relative', zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, margin: '0 auto 16px',
            boxShadow: '0 0 40px var(--accent-glow)',
          }}>❄</div>
          <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>فريزكو</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 6, letterSpacing: '0.08em' }}>
            مدير مستودع التبريد
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: 32,
          boxShadow: 'var(--shadow)',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, color: 'var(--text)' }}>
            تسجيل الدخول إلى حسابك
          </h2>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label>عنوان البريد الإلكتروني</label>
              <input
                type="email"
                placeholder="أنت@الشركة.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>كلمة المرور</label>
              <input
                type="password"
                placeholder="أدخل كلمة المرور"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '12px' }}
            >
              {loading ? (
                <><div className="spinner" style={{ width: 16, height: 16 }} /> جاري التسجيل...</>
              ) : 'تسجيل دخول'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-3)' }}>
          تواصل مع المسؤول إذا كنت تحتاج للوصول.
        </p>
      </div>
    </div>
  )
}
