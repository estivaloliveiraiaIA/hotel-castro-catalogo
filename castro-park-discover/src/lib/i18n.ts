import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "pt",
    supportedLngs: ["pt", "en", "es"],
    defaultNS: "translation",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18n_lang",
    },
    backend: {
      loadPath: `${import.meta.env.BASE_URL}locales/{{lng}}/{{ns}}.json`,
    },
  });

// Load translations synchronously from static imports
// to avoid flash of untranslated content
const loadTranslations = async () => {
  const [pt, en, es] = await Promise.all([
    fetch(`${import.meta.env.BASE_URL}locales/pt/translation.json`).then((r) =>
      r.json()
    ),
    fetch(`${import.meta.env.BASE_URL}locales/en/translation.json`).then((r) =>
      r.json()
    ),
    fetch(`${import.meta.env.BASE_URL}locales/es/translation.json`).then((r) =>
      r.json()
    ),
  ]);
  i18n.addResourceBundle("pt", "translation", pt, true, true);
  i18n.addResourceBundle("en", "translation", en, true, true);
  i18n.addResourceBundle("es", "translation", es, true, true);
};

loadTranslations();

export default i18n;
