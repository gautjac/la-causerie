import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// The interface language. A FIGURE may speak whatever fits them (Sōseki opens in
// Japanese), but the surrounding salon, and the language the user is nudged to
// write in, follows this.
export type UiLang = "fr" | "en";

type Dict = Record<string, string>;

const FR: Dict = {
  "app.title": "La Causerie",
  "app.tagline": "Un souper avec un grand esprit",
  "app.lede":
    "Asseyez-vous en face d'un esprit illustre et causez — vraiment. Ils enseignent par le dialogue, vous renvoient la question, et ne sortent jamais de leur personnage.",
  "lang.label": "Langue",
  "nav.salon": "Le salon",
  "nav.carnet": "Le carnet",
  // question du jour
  "qod.kicker": "La question du jour",
  "qod.bring": "Apportez-la à table, ou venez avec la vôtre.",
  "qod.own": "Votre propre question…",
  "qod.atTable": "À table avec cette question",
  // roster
  "roster.kicker": "Les convives",
  "roster.choose": "Choisissez un convive",
  "roster.summon": "Inviter quelqu'un d'autre",
  "roster.summonPlaceholder": "Un nom — Platon, Billie Holiday, votre grand-mère…",
  "roster.summonGo": "Mettre un couvert",
  "roster.summonHint": "On dresse une place pour n'importe quel esprit, vivant ou non.",
  "roster.summoning": "On dresse le couvert…",
  // table / chat
  "table.back": "le salon",
  "table.placeOf": "La place de",
  "table.opening": "{name} prend la parole…",
  "table.compose": "Dites quelque chose à {name}…",
  "table.send": "Servir",
  "table.thinking": "{name} réfléchit",
  "table.questionAtTable": "À table",
  "table.distill": "Distiller",
  "table.distilling": "On distille la soirée…",
  "table.distillHint": "En fin de causerie : gardez 2–3 idées + une chose à découvrir.",
  "table.newGuest": "Nouveau convive",
  "table.errorReply": "La conversation a déraillé. Réessayez dans un instant.",
  "table.empty": "La table est mise. À vous d'ouvrir — ou laissez {name} commencer.",
  "table.letThemStart": "Laissez {name} ouvrir",
  // carnet
  "carnet.kicker": "Le carnet",
  "carnet.lede": "Ce que vous avez gardé des soupers — idées et choses à découvrir.",
  "carnet.empty": "Le carnet est vide. Après une causerie, touchez « Distiller » pour y déposer ce qui mérite d'être gardé.",
  "carnet.ideas": "À garder",
  "carnet.next": "À découvrir",
  "carnet.with": "avec",
  "carnet.continue": "Reprendre la causerie",
  "carnet.kind.lire": "À lire",
  "carnet.kind.voir": "À voir",
  "carnet.kind.ecouter": "À écouter",
  // onboarding
  "onb.skip": "Passer",
  "onb.next": "Suivant",
  "onb.start": "À table",
  "onb.1.title": "Un souper, chaque jour, avec un grand esprit.",
  "onb.1.body": "Pas une interview. Une vraie conversation socratique — dans leur voix, leur époque, leur manière de penser.",
  "onb.2.title": "Ils vous renvoient la question.",
  "onb.2.body": "Montaigne doute, Miles vous pousse, Weil vous reprend. Ils enseignent par le dialogue et ne sortent jamais de leur rôle.",
  "onb.3.title": "Gardez ce qui compte.",
  "onb.3.body": "À la fin, « Distiller » dépose dans votre carnet 2–3 idées et une chose à lire, voir ou écouter ensuite.",
  // misc
  "common.years": "{years}",
  "common.retry": "Réessayer",
  "common.close": "Fermer",
  "common.youSummoned": "Convive invité",
};

const EN: Dict = {
  "app.title": "La Causerie",
  "app.tagline": "Supper with an illustrious mind",
  "app.lede":
    "Sit across from a great mind and talk — really talk. They teach by dialogue, ask you questions back, and never break character.",
  "lang.label": "Language",
  "nav.salon": "The salon",
  "nav.carnet": "The notebook",
  "qod.kicker": "Question of the day",
  "qod.bring": "Bring it to the table, or arrive with your own.",
  "qod.own": "Your own question…",
  "qod.atTable": "Sit down with this question",
  "roster.kicker": "The guests",
  "roster.choose": "Choose a guest",
  "roster.summon": "Invite someone else",
  "roster.summonPlaceholder": "A name — Plato, Billie Holiday, your grandmother…",
  "roster.summonGo": "Set a place",
  "roster.summonHint": "We'll lay a setting for any mind, living or not.",
  "roster.summoning": "Laying the setting…",
  "table.back": "the salon",
  "table.placeOf": "The seat of",
  "table.opening": "{name} is speaking…",
  "table.compose": "Say something to {name}…",
  "table.send": "Serve",
  "table.thinking": "{name} is thinking",
  "table.questionAtTable": "On the table",
  "table.distill": "Distill",
  "table.distilling": "Distilling the evening…",
  "table.distillHint": "At the end of a causerie: keep 2–3 ideas + one thing to discover.",
  "table.newGuest": "New guest",
  "table.errorReply": "The conversation stumbled. Try again in a moment.",
  "table.empty": "The table is set. Open however you like — or let {name} begin.",
  "table.letThemStart": "Let {name} open",
  "carnet.kicker": "The notebook",
  "carnet.lede": "What you kept from the suppers — ideas and things to discover.",
  "carnet.empty": "The notebook is empty. After a causerie, tap “Distill” to keep what's worth keeping.",
  "carnet.ideas": "To keep",
  "carnet.next": "To discover",
  "carnet.with": "with",
  "carnet.continue": "Resume the causerie",
  "carnet.kind.lire": "To read",
  "carnet.kind.voir": "To watch",
  "carnet.kind.ecouter": "To listen",
  "onb.skip": "Skip",
  "onb.next": "Next",
  "onb.start": "Sit down",
  "onb.1.title": "Supper, every day, with a great mind.",
  "onb.1.body": "Not an interview. A real Socratic conversation — in their voice, their era, their way of thinking.",
  "onb.2.title": "They ask you questions back.",
  "onb.2.body": "Montaigne doubts, Miles pushes you, Weil corrects you. They teach by dialogue and never break character.",
  "onb.3.title": "Keep what matters.",
  "onb.3.body": "At the end, “Distill” drops 2–3 ideas into your notebook plus one thing to read, watch, or listen to next.",
  "common.years": "{years}",
  "common.retry": "Try again",
  "common.close": "Close",
  "common.youSummoned": "Summoned guest",
};

const STRINGS: Record<UiLang, Dict> = { fr: FR, en: EN };

// Shared across the whole Atelier family on purpose — one toggle, one choice.
const KEY = "atelier:lang";

interface LangCtx {
  lang: UiLang;
  setLang: (l: UiLang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<LangCtx | null>(null);

function detectDefault(): UiLang {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "fr" || saved === "en") return saved;
    if (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("en")) {
      return "en";
    }
  } catch {
    /* ignore */
  }
  return "fr";
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<UiLang>(detectDefault);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, lang);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key: string, vars?: Record<string, string | number>): string => {
    let s = STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
    }
    return s;
  };

  return <Ctx.Provider value={{ lang, setLang: setLangState, t }}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}
