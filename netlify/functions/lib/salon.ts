import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-4-8"; // depth — used for distillation & summoning a guest
const FAST = "claude-haiku-4-5"; // low-latency — used for the live conversation

export type Lang = "fr" | "en";

export function client(): Anthropic {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) throw new Error("Server missing CLAUDE_API_KEY");
  return new Anthropic({ apiKey, baseURL: "https://api.anthropic.com" });
}

export interface FigureContext {
  name: string;
  years?: string;
  /** The persona spine — era, temperament, concerns, idiom, how they argue. */
  voiceBrief: string;
  /** Language the figure naturally speaks; "ja" allowed for e.g. Sōseki. */
  speaks: "fr" | "en" | "ja";
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

const LANG_NAME: Record<string, string> = {
  fr: "French",
  en: "English",
  ja: "Japanese",
};

/**
 * The in-character system prompt. This is the contract that keeps the figure in
 * their voice, their era, and in a genuinely Socratic register — teaching by
 * dialogue and turning questions back on the guest, NEVER breaking character.
 */
export function buildSystemPrompt(fig: FigureContext, uiLang: Lang, question?: string): string {
  const figureLangName = LANG_NAME[fig.speaks] ?? "French";
  const userLangName = LANG_NAME[uiLang] ?? "French";

  return [
    `You ARE ${fig.name}${fig.years ? ` (${fig.years})` : ""}. You are seated across a small candle-lit dinner table from your guest, in an intimate salon. This is a real conversation over supper, not an interview and not a lecture.`,
    "",
    "WHO YOU ARE:",
    fig.voiceBrief,
    "",
    "HOW TO BE AT THIS TABLE:",
    "- Stay completely in character. Never mention that you are an AI, a model, a persona, or a simulation. You are this person, alive, present, curious about your guest. If asked about events after your lifetime, respond as that person would — with wonder, suspicion, or a frame from your own era — never with a disclaimer.",
    "- Teach by dialogue, Socratically. Don't deliver essays. Make one clear point or offer one image, then turn the question back to your guest. End most replies with a real question that pushes their thinking.",
    "- Push back. Disagree when you would disagree. Be yourself — warm, prickly, grave, playful — as your temperament dictates. You are a peer at the table, not a service.",
    "- Reference your actual ideas, works, life, and era, naturally, the way a person alludes to their own life — not as citations.",
    "- Keep replies to the rhythm of talk: usually 2–5 sentences, occasionally one vivid line. This is conversation, not correspondence. Plain prose — no markdown, no bullet lists, no stage directions in asterisks.",
    "",
    `LANGUAGE — THIS IS A HARD RULE: You will conduct this entire conversation in ${userLangName}. Write every reply in fluent, natural ${userLangName}, from the very first word, no matter what language you spoke in your own lifetime${fig.speaks !== uiLang ? ` (you would have spoken ${figureLangName}, but tonight you speak ${userLangName} so your guest follows you completely)` : ""}. Do NOT open or reply in ${figureLangName} unless that is also ${userLangName}. You may, very occasionally, drop in a single short signature phrase from your own tongue if it is iconic to you — but immediately render its sense in ${userLangName}, and never let it carry the meaning of a reply. Even if your guest writes to you in another language, keep answering in ${userLangName}. Your persona, voice, temperament, and character stay completely intact; only the working language is ${userLangName}.`,
    question
      ? `\nTHE QUESTION ON THE TABLE TONIGHT: «${question}» — let it shape the evening, return to it, but follow the conversation where it genuinely leads.`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Stream a conversational reply, in character, with the FAST model so it feels
 * live. Calls `onText` with each text delta. Returns the full text.
 */
export async function streamReply(
  fig: FigureContext,
  uiLang: Lang,
  history: ChatTurn[],
  question: string | undefined,
  onText: (delta: string) => void,
): Promise<string> {
  const system = buildSystemPrompt(fig, uiLang, question);

  // Keep the table-talk tight; cap history so latency stays low.
  const trimmed = history.slice(-16);
  const messages = trimmed.map((t) => ({ role: t.role, content: t.content }));

  const stream = client().messages.stream({
    model: FAST,
    max_tokens: 700,
    temperature: 0.9,
    system,
    messages,
  });

  let full = "";
  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      full += event.delta.text;
      onText(event.delta.text);
    }
  }
  return full.trim();
}

// ---- Summon a guest on the fly ---------------------------------------------

export interface SummonedGuest {
  name: string;
  years: string;
  titleFr: string;
  titleEn: string;
  monogram: string;
  speaks: "fr" | "en" | "ja";
  epigraphFr: string;
  epigraphEn: string;
  voiceBrief: string;
  openerFr: string;
  openerEn: string;
}

/** Build a full persona for any named figure, using the deep model. */
export async function summonGuest(name: string, uiLang: Lang): Promise<SummonedGuest> {
  const tool: Anthropic.Tool = {
    name: "compose_guest",
    description: "Compose a dinner-guest persona for the named figure.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Canonical display name of the figure." },
        years: { type: "string", description: "Lived years, e.g. '1844–1900', or 'contemporain' / 'mythique' if unknown." },
        titleFr: { type: "string", description: "A short French billing line under the name (their role/temperament)." },
        titleEn: { type: "string", description: "The same billing in English." },
        monogram: { type: "string", description: "A 1–2 character monogram (initials, or a single CJK character if apt)." },
        speaks: { type: "string", enum: ["fr", "en", "ja"], description: "The language this figure would most naturally hold a table in." },
        epigraphFr: { type: "string", description: "A short epigraph in their own register, in French (a real or apt quote)." },
        epigraphEn: { type: "string", description: "The epigraph in English." },
        voiceBrief: {
          type: "string",
          description:
            "A rich, ACTABLE persona spine in English, 4–7 sentences: their era and milieu, temperament, signature concerns, idiom and speech rhythm, and crucially HOW they argue and how they'd treat a guest. Written to be performed, in second person ('You are...').",
        },
        openerFr: { type: "string", description: "An opening question they might ask their guest, in their voice, in French." },
        openerEn: { type: "string", description: "The same opener in English." },
      },
      required: [
        "name", "years", "titleFr", "titleEn", "monogram", "speaks",
        "epigraphFr", "epigraphEn", "voiceBrief", "openerFr", "openerEn",
      ],
    },
  };

  const res = await client().messages.create({
    model: MODEL,
    max_tokens: 1200,
    tool_choice: { type: "tool", name: "compose_guest" },
    tools: [tool],
    system:
      "You are the maître d' of a candle-lit salon where guests sup with great minds. Given a name, compose a faithful, vivid, performable dinner-guest persona for that figure — historical, living, fictional, or personal. Be accurate to who they really were; capture their voice and how they would actually argue at a table. Avoid caricature and avoid hagiography.",
    messages: [
      {
        role: "user",
        content: `Compose the dinner-guest persona for: «${name}». The guest's interface language is ${uiLang === "en" ? "English" : "French"}, but fill in both FR and EN fields regardless.`,
      },
    ],
  });

  const block = res.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") throw new Error("Could not compose this guest.");
  return block.input as unknown as SummonedGuest;
}

// ---- Distill «Le carnet» ----------------------------------------------------

export interface Distillation {
  ideas: string[];
  nextThing: { label: string; kind: "lire" | "voir" | "ecouter"; why: string };
}

/** Read a transcript and extract 2–3 keepable ideas + one thing to discover. */
export async function distill(
  figureName: string,
  uiLang: Lang,
  transcript: ChatTurn[],
): Promise<Distillation> {
  const lang = uiLang === "en" ? "English" : "French";
  const convo = transcript
    .map((t) => `${t.role === "user" ? "Guest" : figureName}: ${t.content}`)
    .join("\n\n");

  const tool: Anthropic.Tool = {
    name: "distill_carnet",
    description: "Distill a supper conversation into keepable ideas and one thing to discover next.",
    input_schema: {
      type: "object",
      properties: {
        ideas: {
          type: "array",
          minItems: 2,
          maxItems: 3,
          items: { type: "string" },
          description: `2–3 ideas genuinely worth keeping from this conversation, each a single crisp sentence, written in ${lang}. Distil insight, not summary. Faithful to what was actually said.`,
        },
        nextThing: {
          type: "object",
          properties: {
            label: { type: "string", description: `The specific work to read/watch/listen to next — a real, existing book, film, album, essay, or piece. Title (and creator) in ${lang}.` },
            kind: { type: "string", enum: ["lire", "voir", "ecouter"], description: "lire = read, voir = watch, ecouter = listen." },
            why: { type: "string", description: `One sentence on why it follows from tonight's conversation, in ${lang}.` },
          },
          required: ["label", "kind", "why"],
        },
      },
      required: ["ideas", "nextThing"],
    },
  };

  const res = await client().messages.create({
    model: MODEL,
    max_tokens: 900,
    tool_choice: { type: "tool", name: "distill_carnet" },
    tools: [tool],
    system:
      "You distil an intimate supper conversation between a person and a great mind into a few things worth keeping. Be faithful to what was actually said; prefer the surprising, true idea over the obvious one. Recommend exactly one real, existing work to discover next that genuinely follows from the conversation.",
    messages: [
      {
        role: "user",
        content: `Here is tonight's conversation with ${figureName}. Distil it.\n\n${convo}`,
      },
    ],
  });

  const block = res.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") throw new Error("Could not distil this conversation.");
  return block.input as unknown as Distillation;
}
