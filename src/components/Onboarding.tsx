import { useState } from "react";
import { useLang } from "../i18n";
import { Candle } from "./Candle";
import { LangToggle } from "./LangToggle";

export function Onboarding({ onDone }: { onDone: () => void }) {
  const { t } = useLang();
  const [step, setStep] = useState(0);
  const last = step === 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
      <div className="absolute inset-0 bg-espresso-deep/85 backdrop-blur-sm" />
      <div className="relative w-full max-w-md animate-riseIn rounded-3xl border border-brass/30 bg-espresso-wood/90 p-7 shadow-plate sm:p-9">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Candle size={20} />
            <span className="font-display text-lg tracking-tight text-cream">
              {t("app.title")}
            </span>
          </div>
          <LangToggle />
        </div>

        <div className="min-h-[8.5rem]">
          <p className="salon-caps mb-3 text-[0.62rem] text-brass-light">
            {String(step + 1).padStart(2, "0")} / 03
          </p>
          <h2 className="mb-3 font-display text-2xl leading-snug text-cream-light">
            {t(`onb.${step + 1}.title`)}
          </h2>
          <p className="text-[0.98rem] leading-relaxed text-cream/80">
            {t(`onb.${step + 1}.body`)}
          </p>
        </div>

        <div className="mt-7 flex items-center justify-between">
          <button
            onClick={onDone}
            className="salon-caps text-[0.62rem] text-cream-muted transition-colors hover:text-cream"
          >
            {t("onb.skip")}
          </button>
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: i === step ? 18 : 6,
                    background: i === step ? "#f2c14e" : "rgba(199,154,75,0.35)",
                  }}
                />
              ))}
            </div>
            <button
              onClick={() => (last ? onDone() : setStep((s) => s + 1))}
              className="salon-caps rounded-full bg-brass px-5 py-2.5 text-[0.66rem] text-espresso-deep shadow-candle-sm transition-transform hover:scale-[1.03] active:scale-95"
            >
              {last ? t("onb.start") : t("onb.next")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
