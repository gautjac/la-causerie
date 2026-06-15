import { useState } from "react";
import { useLang } from "../i18n";
import { ACCENTS, DOMAIN_LABEL, PERSONAS, type Persona } from "../personas";
import { questionOfTheDay } from "../questions";
import { summon, type SummonedGuest } from "../api";
import { Monogram } from "./Monogram";
import { Candle } from "./Candle";
import { LangToggle } from "./LangToggle";

export interface SeatedGuest {
  figureId: string;
  figureName: string;
  monogram: string;
  accent: string;
  speaks: Persona["speaks"];
  voiceBrief: string;
  years?: string;
  titleFr: string;
  titleEn: string;
}

function personaToGuest(p: Persona): SeatedGuest {
  return {
    figureId: p.id,
    figureName: p.name,
    monogram: p.monogram,
    accent: ACCENTS[p.accent],
    speaks: p.speaks,
    voiceBrief: p.voiceBrief,
    years: p.years,
    titleFr: p.titleFr,
    titleEn: p.titleEn,
  };
}

function slug(name: string): string {
  return name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function summonedToGuest(s: SummonedGuest): SeatedGuest {
  return {
    figureId: `summoned:${slug(s.name)}`,
    figureName: s.name,
    monogram: s.monogram || s.name.slice(0, 2).toUpperCase(),
    accent: ACCENTS.gold,
    speaks: s.speaks,
    voiceBrief: s.voiceBrief,
    years: s.years,
    titleFr: s.titleFr,
    titleEn: s.titleEn,
  };
}

export function Salon({
  onSeat,
  onOpenCarnet,
  carnetCount,
}: {
  onSeat: (guest: SeatedGuest, question?: string) => void;
  onOpenCarnet: () => void;
  carnetCount: number;
}) {
  const { lang, t } = useLang();
  const qod = questionOfTheDay();
  const [ownQ, setOwnQ] = useState("");
  const [chosenQ, setChosenQ] = useState<string | undefined>(undefined);
  const [summonName, setSummonName] = useState("");
  const [summoning, setSummoning] = useState(false);
  const [summonErr, setSummonErr] = useState<string | null>(null);

  const activeQuestion = chosenQ ?? (ownQ.trim() ? ownQ.trim() : undefined);

  async function doSummon() {
    const name = summonName.trim();
    if (name.length < 2 || summoning) return;
    setSummoning(true);
    setSummonErr(null);
    try {
      const guest = summonedToGuest(await summon(name, lang));
      onSeat(guest, activeQuestion);
    } catch (e) {
      setSummonErr(e instanceof Error ? e.message : t("table.errorReply"));
    } finally {
      setSummoning(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-5 pb-20 pt-7 sm:px-8">
      {/* masthead */}
      <header className="mb-9 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Candle size={26} />
          <div>
            <h1 className="font-display text-[1.7rem] font-semibold leading-none tracking-tight text-cream-light">
              {t("app.title")}
            </h1>
            <p className="salon-caps mt-1.5 text-[0.6rem] text-brass-light">{t("app.tagline")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenCarnet}
            className="salon-caps relative rounded-full border border-brass/30 bg-espresso-wood/60 px-3.5 py-2 text-[0.6rem] text-cream-muted backdrop-blur transition-colors hover:text-cream"
          >
            {t("nav.carnet")}
            {carnetCount > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brass px-1 text-[0.58rem] font-semibold text-espresso-deep">
                {carnetCount}
              </span>
            )}
          </button>
          <LangToggle />
        </div>
      </header>

      <p className="mb-9 max-w-2xl font-display text-[1.12rem] leading-relaxed text-cream/80">
        {t("app.lede")}
      </p>

      {/* La question du jour */}
      <section className="mb-11 overflow-hidden rounded-2xl border border-brass/25 bg-gradient-to-br from-espresso-wood/80 to-espresso/60 p-6 shadow-seat sm:p-7">
        <p className="salon-caps mb-3 text-[0.6rem] text-brass-light">{t("qod.kicker")}</p>
        <button
          onClick={() => setChosenQ((c) => (c === qod[lang] ? undefined : qod[lang]))}
          className="block text-left"
        >
          <span
            className={`font-display text-2xl italic leading-snug transition-colors sm:text-[1.7rem] ${
              chosenQ === qod[lang] ? "text-candle" : "text-cream-light hover:text-candle"
            }`}
          >
            « {qod[lang]} »
          </span>
        </button>
        <p className="mt-3 text-sm text-cream/55">{t("qod.bring")}</p>
        <div className="mt-4 flex items-center gap-2">
          <input
            value={ownQ}
            onChange={(e) => {
              setOwnQ(e.target.value);
              setChosenQ(undefined);
            }}
            placeholder={t("qod.own")}
            className="composer flex-1 rounded-lg border border-brass/20 bg-espresso-deep/40 px-3.5 py-2.5 text-[0.95rem]"
          />
        </div>
        {activeQuestion && (
          <p className="mt-3 text-[0.82rem] text-brass-light/80">
            ✦ « {activeQuestion} » — {t("roster.choose").toLowerCase()}
          </p>
        )}
      </section>

      {/* Roster */}
      <section className="mb-11">
        <div className="mb-5 flex items-baseline gap-3">
          <h2 className="font-display text-lg text-cream-light">{t("roster.choose")}</h2>
          <span className="hairline flex-1" />
        </div>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {PERSONAS.map((p) => {
            const accent = ACCENTS[p.accent];
            return (
              <button
                key={p.id}
                onClick={() => onSeat(personaToGuest(p), activeQuestion)}
                className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-brass/15 bg-espresso-wood/55 p-5 text-left shadow-seat transition-all duration-300 hover:-translate-y-0.5 hover:border-brass/40 hover:shadow-candle"
              >
                <span
                  className="pointer-events-none absolute inset-x-0 top-0 h-[3px] opacity-70"
                  style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
                />
                <div className="flex items-start gap-3.5">
                  <Monogram text={p.monogram} accent={accent} size={52} />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-[1.18rem] font-semibold leading-tight text-cream-light">
                      {p.name}
                    </h3>
                    <p className="mt-0.5 text-[0.72rem] text-cream-muted tnum">
                      {p.years} · {DOMAIN_LABEL[p.domain][lang]}
                    </p>
                  </div>
                </div>
                <p className="text-[0.86rem] leading-snug text-cream/65">
                  {lang === "en" ? p.titleEn : p.titleFr}
                </p>
                <p
                  className="mt-auto border-l-2 pl-3 font-display text-[0.92rem] italic leading-snug text-cream/55"
                  style={{ borderColor: accent }}
                >
                  « {lang === "en" ? p.epigraphEn : p.epigraphFr} »
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Summon */}
      <section className="rounded-2xl border border-dashed border-brass/30 bg-espresso-wood/40 p-6 sm:p-7">
        <p className="salon-caps mb-2 text-[0.6rem] text-brass-light">{t("roster.summon")}</p>
        <p className="mb-4 text-sm text-cream/60">{t("roster.summonHint")}</p>
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <input
            value={summonName}
            onChange={(e) => setSummonName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSummon()}
            disabled={summoning}
            placeholder={t("roster.summonPlaceholder")}
            className="composer flex-1 rounded-xl border border-brass/25 bg-espresso-deep/40 px-4 py-3 text-[1rem]"
          />
          <button
            onClick={doSummon}
            disabled={summoning || summonName.trim().length < 2}
            className="salon-caps shrink-0 rounded-xl bg-brass px-5 py-3 text-[0.66rem] text-espresso-deep shadow-candle-sm transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
          >
            {summoning ? t("roster.summoning") : t("roster.summonGo")}
          </button>
        </div>
        {summonErr && <p className="mt-3 text-sm text-claret">{summonErr}</p>}
      </section>
    </div>
  );
}
