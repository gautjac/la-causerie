import { useLang } from "../i18n";

export function LangToggle() {
  const { lang, setLang, t } = useLang();
  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-full border border-brass/30 bg-espresso-wood/60 p-0.5 backdrop-blur"
      role="group"
      aria-label={t("lang.label")}
    >
      {(["fr", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`salon-caps rounded-full px-2.5 py-1 text-[0.62rem] transition-colors ${
            lang === l ? "bg-brass text-espresso-deep" : "text-cream-muted hover:text-cream"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
