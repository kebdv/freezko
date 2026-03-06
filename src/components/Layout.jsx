import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useLanguage } from '../LanguageContext'

export default function Layout({ user }) {
  const navigate = useNavigate()
  const { t, isRTL, toggleLanguage, lang } = useLanguage()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const navItems = [
    { path: '/', label: t.dashboard, icon: '⬡', exact: true },
    { path: '/clients', label: t.clients, icon: '◈' },
    { path: '/operations', label: t.operations, icon: '⇅' },
    { path: '/inventory', label: t.inventory, icon: '▦' },
    ...(isMobile ? [{ path: '/scan', label: t.scanNow, icon: '▣', mobile: true }] : []),
  ]

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const displayName = user.user_metadata?.full_name || user.email.split('@')[0]

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', direction: isRTL ? 'rtl' : 'ltr' }}>
      {sidebarOpen && isMobile && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99,
        }} />
      )}

      {/* Sidebar */}
      <aside style={{
        width: 'var(--sidebar-w)',
        background: 'var(--bg-2)',
        borderRight: isRTL ? 'none' : '1px solid var(--border)',
        borderLeft: isRTL ? '1px solid var(--border)' : 'none',
        display: 'flex', flexDirection: 'column', flexShrink: 0, zIndex: 100,
        ...(isMobile ? {
          position: 'fixed', top: 0,
          right: isRTL ? 0 : 'auto',
          left: isRTL ? 'auto' : 0,
          bottom: 0,
          transform: sidebarOpen ? 'translateX(0)' : (isRTL ? 'translateX(100%)' : 'translateX(-100%)'),
          transition: 'transform 0.25s ease',
        } : {}),
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: '#fff', flexShrink: 0,
            }}>❄</div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: 'var(--text)', letterSpacing: '-0.02em' }}>COLDSTORE</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{t.appSubtitle}</div>
            </div>
          </div>

          {/* Language toggle */}
          <button onClick={toggleLanguage} style={{
            marginTop: 12, width: '100%',
            background: 'var(--bg-3)', border: '1px solid var(--border)',
            color: 'var(--accent)', borderRadius: 'var(--radius-sm)',
            padding: '7px 10px', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', fontFamily: lang === 'ar' ? 'var(--font)' : 'var(--font-mono)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'all 0.15s', letterSpacing: lang === 'en' ? '0.05em' : 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-glow)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-3)' }}>
            🌐 {t.switchLanguage}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path} end={item.exact}
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                marginBottom: 2, textDecoration: 'none', fontSize: 14, fontWeight: 500,
                transition: 'all 0.15s',
                color: item.mobile ? 'var(--accent-2)' : (isActive ? 'var(--accent)' : 'var(--text-2)'),
                background: isActive ? 'var(--accent-glow)' : (item.mobile ? 'rgba(0,212,170,0.08)' : 'transparent'),
                border: isActive ? '1px solid rgba(59,158,255,0.2)' : (item.mobile ? '1px solid rgba(0,212,170,0.2)' : '1px solid transparent'),
              })}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
              {item.mobile && (
                <span style={{ marginInlineStart: 'auto', fontSize: 10, background: 'var(--accent-2)', color: '#000', padding: '2px 6px', borderRadius: 10, fontWeight: 700 }}>
                  MOBILE
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '14px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>{displayName[0].toUpperCase()}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            marginTop: 12, width: '100%', background: 'transparent',
            border: '1px solid var(--border)', color: 'var(--text-2)',
            borderRadius: 'var(--radius-sm)', padding: '7px', fontSize: 12,
            cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--danger)'; e.currentTarget.style.color = 'var(--danger)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' }}>
            ⏻ {t.signOut}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {isMobile && (
          <header style={{
            height: 'var(--topbar-h)', background: 'var(--bg-2)',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0,
          }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
              background: 'none', border: 'none', color: 'var(--text-2)',
              cursor: 'pointer', fontSize: 22, padding: 4,
            }}>☰</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>❄</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14 }}>COLDSTORE</span>
            </div>
            <div style={{ marginInlineStart: 'auto' }}>
              <button onClick={toggleLanguage} style={{
                background: 'var(--bg-3)', border: '1px solid var(--border)',
                color: 'var(--accent)', borderRadius: 'var(--radius-sm)',
                padding: '5px 10px', fontSize: 11, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'var(--font)',
              }}>
                🌐 {t.switchLanguage}
              </button>
            </div>
          </header>
        )}

        <main style={{ flex: 1, overflow: 'auto', padding: isMobile ? '16px' : '28px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
