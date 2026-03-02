import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { supabase } from '../supabaseClient'
import logoImage from '../assets/FREEZKO logo .webp'

const navItems = [
  { path: '/', label: 'لوحة التحكم', icon: '⬡', exact: true },
  { path: '/clients', label: 'العملاء', icon: '◈' },
  { path: '/operations', label: 'العمليات', icon: '⇅' },
  { path: '/inventory', label: 'المخزون الحالي', icon: '▦' },
]

export default function Layout({ user }) {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99,
            display: 'none'
          }}
          className="mobile-overlay"
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: 'var(--sidebar-w)',
        background: 'var(--bg-2)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        zIndex: 100,
      }} className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        {/* Logo */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              overflow: 'hidden',
              background: 'var(--bg-3)',
              border: '1px solid var(--border)',
            }}>
              <img src={logoImage} alt="FREEZKO" style={{ width: '150%', height: '150%', objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: 'var(--text)', letterSpacing: '-0.02em' }}>كولدستور</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.1em' }}>مدير مستودع</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 2,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 500,
                transition: 'all 0.15s',
                color: isActive ? 'var(--accent)' : 'var(--text-2)',
                background: isActive ? 'var(--accent-glow)' : 'transparent',
                border: isActive ? '1px solid rgba(59,158,255,0.2)' : '1px solid transparent',
              })}
            >
              <span style={{ fontSize: 16, opacity: 0.8 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div style={{ padding: '14px 14px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--accent-glow)',
              border: '1px solid var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: 'var(--accent)', flexShrink: 0,
              overflow: 'hidden',
            }}>
              {user.email[0].toUpperCase()}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>موظف</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              marginTop: 12, width: '100%', background: 'transparent',
              border: '1px solid var(--border)', color: 'var(--text-2)',
              borderRadius: 'var(--radius-sm)', padding: '7px', fontSize: 12,
              cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--danger)'; e.currentTarget.style.color = 'var(--danger)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' }}
          >
            ⏻ تسجيل خروج
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar (mobile) */}
        <header style={{
          height: 'var(--topbar-h)',
          background: 'var(--bg-2)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: 16,
          flexShrink: 0,
        }} className="topbar">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="menu-toggle"
            style={{
              background: 'none', border: 'none', color: 'var(--text-2)',
              cursor: 'pointer', fontSize: 20, padding: 4, display: 'none',
            }}
          >
            ☰
          </button>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
            {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflow: 'auto', padding: '28px' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            top: 0; right: 0; bottom: 0;
            transform: translateX(100%);
            transition: transform 0.25s ease;
          }
          .sidebar.sidebar-open {
            transform: translateX(0);
          }
          .mobile-overlay {
            display: block !important;
          }
          .menu-toggle {
            display: block !important;
          }
          .topbar {
            display: flex !important;
          }
          main {
            padding: 16px !important;
          }
        }
      `}</style>
    </div>
  )
}
