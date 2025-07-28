import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslation from '../../public/locales/en/translation.json';
import esTranslation from '../../public/locales/es/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation
      },
      es: {
        translation: esTranslation
      }
    },
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false, // React already escapes
    },

    // Configure pluralization and formatting
    pluralSeparator: '_',
    contextSeparator: '_',
    
    // Namespace configuration
    defaultNS: 'translation',
    ns: ['translation'],

    // Loading configuration
    load: 'languageOnly', // Load only language codes (en, es) not regions (en-US, es-ES)
    
    // Performance optimizations
    partialBundledLanguages: true,
  });

export default i18n;