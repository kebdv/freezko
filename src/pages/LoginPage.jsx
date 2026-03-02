import { useState } from 'react'
import { supabase } from '../supabaseClient'
import logoImage from '../assets/FREEZKO logo .webp'

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
            width: 96, height: 96, borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            overflow: 'hidden',
            background: 'var(--bg-3)',
            border: '2px solid var(--border)',
          }}>
            <img src={logoImage} alt="FREEZKO" style={{ width: '150%', height: '150%', objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>FREEZKO Manger</h1>
          <p style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 6, letterSpacing: '0.08em' }}>
            Cold Storage Warehouse Manager
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
              <label>البريد الإلكتروني</label>
              <input
                type="email"
                placeholder="you@company.com"
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
              ) : 'تسجيل الدخول'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-3)' }}>
          تواصل مع المسؤول إذا كنت بحاجة إلى الوصول.
        </p>
        
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <a 
            href="tel:01007731844"
            style={{
              display: 'inline-block',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--accent-2)',
              textDecoration: 'none',
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--accent-2)',
              transition: 'all 0.2s',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(0,212,170,0.1)';
              e.currentTarget.style.color = 'var(--accent-2)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--accent-2)';
            }}
          >
            الاتصال بالمسؤول
          </a>
        </div>
      </div>
    </div>
  )
}
