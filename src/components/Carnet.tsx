import { useLiveQuery } from "dexie-react-hooks";
import { useLang } from "../i18n";
import { db, type CarnetEntry, type Conversation } from "../db";
import { Monogram } from "./Monogram";
import { Candle } from "./Candle";
import { LangToggle } from "./LangToggle";

export function Carnet({
  onBack,
  onResume,
}: {
  onBack: () => void;
  onResume: (conv: Conversation) => void;
}) {
  const { lang, t } = useLang();
  const entries = useLiveQuery(
    () => db.carnet.orderBy("createdAt").reverse().toArray(),
    [],
    [] as CarnetEntry[],
  );

  return (
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-7 sm:px-8">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="salon-caps rounded-full border border-brass/25 px-3 py-1.5 text-[0.58rem] text-cream-muted transition-colors hover:text-cream"
          >
            ← {t("nav.salon")}
          </button>
          <div className="flex items-center gap-2.5">
            <Candle size={20} />
            <h1 className="font-display text-[1.4rem] font-semibold leading-none text-cream-light">
              {t("carnet.kicker")}
            </h1>
          </div>
        </div>
        <LangToggle />
      </header>

      <p className="mb-8 max-w-xl font-display text-[1.02rem] leading-relaxed text-cream/70">
        {t("carnet.lede")}
      </p>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brass/25 bg-espresso-wood/30 px-6 py-14 text-center">
          <p className="mx-auto max-w-sm font-display text-[1.02rem] italic leading-relaxed text-cream/55">
            {t("carnet.empty")}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {entries.map((e) => (
            <Entry key={e.id} e={e} onResume={onResume} lang={lang} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function Entry({
  e,
  onResume,
  lang,
  t,
}: {
  e: CarnetEntry;
  onResume: (conv: Conversation) => void;
  lang: "fr" | "en";
  t: (k: string, v?: Record<string, string | number>) => string;
}) {
  const accent = e.accent;
  const k = e.nextThing.kind;
  const kindLabel =
    k === "lire" || k === "read"
      ? t("carnet.kind.lire")
      : k === "voir" || k === "watch"
      ? t("carnet.kind.voir")
      : t("carnet.kind.ecouter");

  async function resume() {
    if (!e.conversationId) return;
    const conv = await db.conversations.get(e.conversationId);
    if (conv) onResume(conv);
  }

  const date = new Date(e.createdAt).toLocaleDateString(lang === "en" ? "en-CA" : "fr-CA", {
    day: "numeric",
    month: "long",
  });

  return (
    <article
      className="animate-riseIn overflow-hidden rounded-2xl border bg-espresso-wood/50 p-5 shadow-seat"
      style={{ borderColor: `${accent}40` }}
    >
      <span
        className="pointer-events-none -mx-5 -mt-5 mb-4 block h-[3px]"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
      />
      <div className="mb-3.5 flex items-center gap-3">
        <Monogram text={e.monogram} accent={accent} size={38} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-[1.05rem] font-semibold leading-tight text-cream-light">
            {e.figureName}
          </p>
          <p className="text-[0.7rem] text-cream-muted">
            {t("carnet.with")} · {date}
          </p>
        </div>
      </div>

      <p className="salon-caps mb-2 text-[0.55rem]" style={{ color: accent }}>
        {t("carnet.ideas")}
      </p>
      <ul className="mb-4 space-y-2">
        {e.ideas.map((idea, i) => (
          <li key={i} className="flex gap-2.5 font-display text-[0.98rem] leading-snug text-cream-light">
            <span style={{ color: accent }}>—</span>
            <span>{idea}</span>
          </li>
        ))}
      </ul>

      <div className="rounded-xl border border-brass/15 bg-espresso-deep/30 px-4 py-3">
        <p className="salon-caps mb-1 text-[0.52rem] text-cream-muted">
          {t("carnet.next")} · {kindLabel}
        </p>
        <p className="font-display text-[0.98rem] font-semibold text-cream-light">{e.nextThing.label}</p>
        <p className="mt-0.5 text-[0.85rem] italic text-cream/55">{e.nextThing.why}</p>
      </div>

      {e.conversationId && (
        <button
          onClick={resume}
          className="salon-caps mt-3.5 text-[0.58rem] text-brass-light transition-colors hover:text-candle"
        >
          {t("carnet.continue")} →
        </button>
      )}
    </article>
  );
}
