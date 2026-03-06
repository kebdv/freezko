import { createContext, useContext, useState, useEffect } from 'react'
import { translations } from './trasnlations'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('cs_lang') || 'ar')
  const [switching, setSwitching] = useState(false)

  const t = translations[lang]
  const isRTL = lang === 'ar'

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang, isRTL])

  async function toggleLanguage() {
    setSwitching(true)
    await new Promise(r => setTimeout(r, 900))
    const newLang = lang === 'ar' ? 'en' : 'ar'
    localStorage.setItem('cs_lang', newLang)
    setLang(newLang)
    setSwitching(false)
  }

  return (
    <LanguageContext.Provider value={{ lang, t, isRTL, switching, toggleLanguage }}>
      {switching && <LangSwitchOverlay lang={lang} t={t} />}
      {children}
    </LanguageContext.Provider>
  )
}

function LangSwitchOverlay({ lang, t }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 16,
        background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, marginBottom: 24,
        boxShadow: '0 0 40px var(--accent-glow)',
        animation: 'pulse 0.8s ease infinite alternate',
      }}>❄</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>
        COLDSTORE
      </div>
      <p style={{ color: 'var(--text-3)', fontSize: 14 }}>{t.switchingLanguage}</p>
      <div style={{ marginTop: 20, width: 180, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent-2))', borderRadius: 2, animation: 'loadBar 0.9s ease forwards' }} />
      </div>
      <style>{`
        @keyframes pulse { from { box-shadow: 0 0 20px var(--accent-glow); } to { box-shadow: 0 0 50px var(--accent-glow); } }
        @keyframes loadBar { from { width: 0; } to { width: 100%; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
