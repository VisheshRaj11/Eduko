import { useTranslation } from 'react-i18next'
import i18n from '../i18n/index.js'
import { FiGlobe } from 'react-icons/fi'
import { useState } from 'react'

const LANGS = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'हिंदी',   flag: '🇮🇳' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
]

export default function LanguageSwitcher() {
  const { i18n: { language } } = useTranslation()
  const [open, setOpen] = useState(false)

  const changeLang = (code) => {
    i18n.changeLanguage(code)
    localStorage.setItem('eduko_lang', code)
    setOpen(false)
  }

  const current = LANGS.find(l => l.code === language) || LANGS[0]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-700 font-medium text-sm transition-colors"
        aria-label="Change language"
      >
        <FiGlobe size={15} />
        <span>{current.flag} {current.label}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50 min-w-[140px] animate-slide-up">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => changeLang(l.code)}
              className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2
                ${language === l.code ? 'bg-primary-50 text-primary-700' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              {l.flag} {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
