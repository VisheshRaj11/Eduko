import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en.js'
import hi from './hi.js'
import pa from './pa.js'

i18n
  .use(initReactI18next)
  .init({
    resources: { en, hi, pa },
    lng: localStorage.getItem('eduko_lang') || 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })

export default i18n
