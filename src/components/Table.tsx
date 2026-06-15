import { useEffect, useRef, useState } from "react";
import { useLang } from "../i18n";
import { streamCauserie, distille, type ChatTurn } from "../api";
import {
  addCarnet,
  createConversation,
  saveTranscript,
  type Conversation,
} from "../db";
import type { SeatedGuest } from "./Salon";
import { Monogram } from "./Monogram";
import { Candle } from "./Candle";
import { LangToggle } from "./LangToggle";

type Distillation = Awaited<ReturnType<typeof distille>>;

export function Table({
  guest,
  question,
  existing,
  onLeave,
  onDistilled,
}: {
  guest: SeatedGuest;
  question?: string;
  existing?: Conversation | null;
  onLeave: () => void;
  onDistilled: () => void;
}) {
  const { lang, t } = useLang();
  const [turns, setTurns] = useState<ChatTurn[]>(existing?.transcript ?? []);
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [convId, setConvId] = useState<number | undefined>(existing?.id);
  const [distilling, setDistilling] = useState(false);
  const [distillation, setDistillation] = useState<Distillation | null>(null);
  const [distillErr, setDistillErr] = useState<string | null>(null);

  const activeQuestion = existing?.question ?? question;
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll the table-talk to the newest line.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, streamText, streaming]);

  // Persist this causerie (create-or-update) whenever the transcript settles.
  async function persist(next: ChatTurn[]) {
    if (convId) {
      await saveTranscript(convId, next);
      return convId;
    }
    const id = await createConversation({
      figureId: guest.figureId,
      figureName: guest.figureName,
      monogram: guest.monogram,
      accent: guest.accent,
      speaks: guest.speaks,
      voiceBrief: guest.voiceBrief,
      question: activeQuestion,
      transcript: next,
    });
    setConvId(id);
    return id;
  }

  async function send(history: ChatTurn[]) {
    setStreaming(true);
    setStreamText("");
    setError(null);
    try {
      const full = await streamCauserie(
        {
          lang,
          figure: {
            name: guest.figureName,
            years: guest.years,
            voiceBrief: guest.voiceBrief,
            speaks: guest.speaks,
          },
          history,
          question: activeQuestion,
        },
        (delta) => setStreamText((s) => s + delta),
      );
      const next = [...history, { role: "assistant" as const, content: full }];
      setTurns(next);
      setStreamText("");
      await persist(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("table.errorReply"));
    } finally {
      setStreaming(false);
    }
  }

  function submit() {
    const text = draft.trim();
    if (!text || streaming) return;
    const next = [...turns, { role: "user" as const, content: text }];
    setTurns(next);
    setDraft("");
    if (taRef.current) taRef.current.style.height = "auto";
    void send(next);
  }

  // Let the figure open the supper (no user message yet).
  function letThemStart() {
    if (streaming || turns.length) return;
    const seed: ChatTurn[] = [
      {
        role: "user",
        content: activeQuestion
          ? `(${lang === "en" ? "I sit down at the table. Open the evening — ask me about" : "Je m'assois à table. Ouvre la soirée — interroge-moi sur"}: «${activeQuestion}».)`
          : `(${lang === "en" ? "I sit down at the table. Open the evening — greet me and ask me your first question." : "Je m'assois à table. Ouvre la soirée — accueille-moi et pose-moi ta première question."})`,
      },
    ];
    setTurns(seed);
    void send(seed);
  }

  async function runDistill() {
    if (distilling) return;
    setDistilling(true);
    setDistillErr(null);
    try {
      const d = await distille(guest.figureName, turns, lang);
      setDistillation(d);
      await addCarnet({
        conversationId: convId,
        figureId: guest.figureId,
        figureName: guest.figureName,
        monogram: guest.monogram,
        accent: guest.accent,
        ideas: d.ideas,
        nextThing: d.nextThing,
      });
      onDistilled();
    } catch (e) {
      setDistillErr(e instanceof Error ? e.message : t("table.errorReply"));
    } finally {
      setDistilling(false);
    }
  }

  const accent = guest.accent;
  // We hide the user's seed-prompt bubble (it's a stage cue, not real talk).
  const visibleTurns = turns.filter(
    (tn, i) => !(i === 0 && tn.role === "user" && tn.content.startsWith("(")),
  );
  const canDistill = turns.filter((tn) => tn.role === "assistant").length >= 1 && !streaming;

  return (
    <div className="flex h-[100dvh] flex-col">
      {/* header */}
      <header className="z-10 border-b border-brass/20 bg-espresso-deep/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <button
            onClick={onLeave}
            className="salon-caps shrink-0 rounded-full border border-brass/25 px-3 py-1.5 text-[0.58rem] text-cream-muted transition-colors hover:text-cream"
          >
            ← {t("table.back")}
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Monogram text={guest.monogram} accent={accent} size={40} />
            <div className="min-w-0">
              <h2 className="truncate font-display text-[1.05rem] font-semibold leading-tight text-cream-light">
                {guest.figureName}
              </h2>
              <p className="truncate text-[0.7rem] text-cream-muted">
                {lang === "en" ? guest.titleEn : guest.titleFr}
              </p>
            </div>
          </div>
          <LangToggle />
        </div>
        {activeQuestion && (
          <div className="border-t border-brass/10 bg-espresso-wood/40">
            <div className="mx-auto max-w-3xl px-4 py-2 sm:px-6">
              <p className="text-[0.78rem] italic text-brass-light/85">
                <span className="salon-caps mr-2 not-italic text-[0.55rem] text-cream-muted">
                  {t("table.questionAtTable")}
                </span>
                « {activeQuestion} »
              </p>
            </div>
          </div>
        )}
      </header>

      {/* table-talk */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
          {visibleTurns.length === 0 && !streaming && (
            <div className="flex flex-col items-center gap-5 py-14 text-center">
              <Candle size={30} />
              <p className="max-w-sm font-display text-[1.05rem] italic leading-relaxed text-cream/70">
                {t("table.empty", { name: guest.figureName.split(" ")[0] })}
              </p>
              <button
                onClick={letThemStart}
                className="salon-caps rounded-full bg-brass/90 px-5 py-2.5 text-[0.62rem] text-espresso-deep shadow-candle-sm transition-transform hover:scale-[1.03] active:scale-95"
              >
                {t("table.letThemStart", { name: guest.figureName.split(" ")[0] })}
              </button>
            </div>
          )}

          <div className="flex flex-col gap-5">
            {visibleTurns.map((tn, i) =>
              tn.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[82%] animate-riseIn rounded-2xl rounded-br-md border border-brass/20 bg-espresso-warm/60 px-4 py-2.5 text-[0.98rem] leading-relaxed text-cream">
                    {tn.content}
                  </div>
                </div>
              ) : (
                <FigureBubble key={i} text={tn.content} monogram={guest.monogram} accent={accent} />
              ),
            )}

            {streaming && (
              <FigureBubble
                text={streamText}
                monogram={guest.monogram}
                accent={accent}
                streaming
                thinkingLabel={t("table.thinking", { name: guest.figureName.split(" ")[0] })}
              />
            )}
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-claret/40 bg-claret/15 px-4 py-3 text-sm text-cream/85">
              {error}
            </div>
          )}

          {/* Distillation result card */}
          {distillation && (
            <DistillCard d={distillation} accent={accent} />
          )}
        </div>
      </div>

      {/* composer + actions */}
      <footer className="border-t border-brass/20 bg-espresso-deep/85 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-3 sm:px-6">
          {canDistill && (
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <p className="hidden text-[0.72rem] text-cream-muted sm:block">{t("table.distillHint")}</p>
              <button
                onClick={runDistill}
                disabled={distilling}
                className="salon-caps ml-auto rounded-full border border-brass/40 bg-brass/10 px-4 py-2 text-[0.6rem] text-brass-light transition-colors hover:bg-brass/20 disabled:opacity-50"
              >
                {distilling ? t("table.distilling") : `✦ ${t("table.distill")}`}
              </button>
            </div>
          )}
          {distillErr && <p className="mb-2 text-sm text-claret">{distillErr}</p>}
          <div className="flex items-end gap-2.5">
            <div className="flex flex-1 items-end rounded-2xl border border-brass/25 bg-espresso-wood/50 px-4 py-2.5">
              <textarea
                ref={taRef}
                value={draft}
                rows={1}
                onChange={(e) => {
                  setDraft(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                disabled={streaming}
                placeholder={t("table.compose", { name: guest.figureName.split(" ")[0] })}
                className="composer max-h-40 text-[1rem] leading-relaxed"
              />
            </div>
            <button
              onClick={submit}
              disabled={streaming || !draft.trim()}
              aria-label={t("table.send")}
              className="salon-caps grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brass text-espresso-deep shadow-candle-sm transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M4 12L20 4L13 20L11 13L4 12Z" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FigureBubble({
  text,
  monogram,
  accent,
  streaming,
  thinkingLabel,
}: {
  text: string;
  monogram: string;
  accent: string;
  streaming?: boolean;
  thinkingLabel?: string;
}) {
  return (
    <div className="flex animate-riseIn items-start gap-3">
      <span className="mt-0.5 shrink-0">
        <Monogram text={monogram} accent={accent} size={34} />
      </span>
      <div
        className="max-w-[86%] rounded-2xl rounded-tl-md border px-4 py-3 text-[1rem] leading-relaxed text-cream-light"
        style={{
          borderColor: `${accent}55`,
          background: `linear-gradient(180deg, ${accent}1f, ${accent}10)`,
        }}
      >
        {!text && streaming ? (
          <span className="flex items-center gap-2 py-0.5 text-cream-muted">
            <span className="flex gap-1" style={{ color: accent }}>
              <span className="thinking-dot" />
              <span className="thinking-dot" />
              <span className="thinking-dot" />
            </span>
            {thinkingLabel && <span className="text-[0.78rem] italic">{thinkingLabel}</span>}
          </span>
        ) : (
          <span className={streaming ? "stream-caret" : ""} style={{ color: streaming ? accent : undefined }}>
            <span className="text-cream-light">{text}</span>
          </span>
        )}
      </div>
    </div>
  );
}

function DistillCard({ d, accent }: { d: Distillation; accent: string }) {
  const { lang, t } = useLang();
  const kindLabel =
    d.nextThing.kind === "lire"
      ? t("carnet.kind.lire")
      : d.nextThing.kind === "voir"
      ? t("carnet.kind.voir")
      : t("carnet.kind.ecouter");
  return (
    <div
      className="mt-7 animate-riseIn rounded-2xl border p-5 shadow-candle-sm"
      style={{ borderColor: `${accent}55`, background: `linear-gradient(180deg, ${accent}1a, transparent)` }}
    >
      <p className="salon-caps mb-3 text-[0.58rem]" style={{ color: accent }}>
        ✦ {t("carnet.ideas")}
      </p>
      <ul className="space-y-2.5">
        {d.ideas.map((idea, i) => (
          <li key={i} className="flex gap-2.5 font-display text-[1.02rem] leading-snug text-cream-light">
            <span style={{ color: accent }}>—</span>
            <span>{idea}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 border-t border-brass/15 pt-4">
        <p className="salon-caps mb-1.5 text-[0.55rem] text-cream-muted">
          {t("carnet.next")} · {kindLabel}
        </p>
        <p className="font-display text-[1rem] font-semibold text-cream-light">{d.nextThing.label}</p>
        <p className="mt-1 text-[0.88rem] italic text-cream/60">{d.nextThing.why}</p>
      </div>
      <p className="mt-4 text-[0.72rem] text-cream-muted">
        {lang === "en" ? "Kept in your notebook." : "Gardé dans votre carnet."}
      </p>
    </div>
  );
}
