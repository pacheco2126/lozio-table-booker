import { useTranslation } from "react-i18next";

const languages = [
  { code: "es", label: "ES" },
  { code: "en", label: "EN" },
  { code: "ca", label: "CA" },
  { code: "it", label: "IT" },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  return (
    <div className="flex items-center gap-1 rounded-md border border-primary-foreground/15 bg-primary-foreground/10 p-1">
      {languages.map((lang) => (
        <button
          type="button"
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          aria-pressed={i18n.language === lang.code}
          aria-label={`Cambiar idioma a ${lang.label}`}
          className={`min-h-[38px] min-w-[38px] rounded-sm px-3 py-2 text-[11px] font-body font-bold uppercase tracking-wider transition-colors ${
            i18n.language === lang.code
              ? "bg-primary text-primary-foreground"
              : "text-primary-foreground/60 hover:text-primary-foreground"
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
