import type { UiLang } from "./i18n";
import type { FigureLang } from "./personas";

export interface FigureContext {
  name: string;
  years?: string;
  voiceBrief: string;
  speaks: FigureLang;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/**
 * Stream one in-character reply. The function emits NDJSON lines: {"t": delta}
 * as the figure speaks, {"done": true} at the end, or {"error": msg}. We parse
 * line-by-line off the live stream and hand each delta to `onDelta` so the
 * bubble fills in like real talk. Returns the full reply text.
 */
export async function streamCauserie(
  req: { lang: UiLang; figure: FigureContext; history: ChatTurn[]; question?: string },
  onDelta: (delta: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch("/api/causerie", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    signal,
  });

  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || `Error ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  const handleLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return; // keepalive newline
    let obj: { t?: string; done?: boolean; error?: string };
    try {
      obj = JSON.parse(trimmed);
    } catch {
      return;
    }
    if (obj.error) throw new Error(obj.error);
    if (typeof obj.t === "string") {
      full += obj.t;
      onDelta(obj.t);
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, nl);
      buffer = buffer.slice(nl + 1);
      handleLine(line);
    }
  }
  if (buffer.trim()) handleLine(buffer);

  return full.trim();
}

// ---- last-line NDJSON parser for the opus endpoints ------------------------

async function readResult<T>(res: Response, lang: UiLang): Promise<T> {
  const raw = await res.text();
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  const last = lines[lines.length - 1] ?? "";
  let parsed: { result?: T; error?: string } | null = null;
  try {
    parsed = last ? JSON.parse(last) : null;
  } catch {
    parsed = null;
  }
  const invalid = lang === "en" ? "Invalid response from the server." : "Réponse invalide du serveur.";
  if (!res.ok) {
    const fallback = lang === "en" ? `Error ${res.status}` : `Erreur ${res.status}`;
    throw new Error(parsed?.error || fallback);
  }
  if (!parsed) throw new Error(invalid);
  if (parsed.error) throw new Error(parsed.error);
  if (parsed.result) return parsed.result;
  throw new Error(invalid);
}

export interface SummonedGuest {
  name: string;
  years: string;
  titleFr: string;
  titleEn: string;
  monogram: string;
  speaks: FigureLang;
  epigraphFr: string;
  epigraphEn: string;
  voiceBrief: string;
  openerFr: string;
  openerEn: string;
}

export async function summon(name: string, lang: UiLang): Promise<SummonedGuest> {
  const res = await fetch("/api/summon", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, lang }),
  });
  return readResult<SummonedGuest>(res, lang);
}

export interface Distillation {
  ideas: string[];
  nextThing: { label: string; kind: "lire" | "voir" | "ecouter"; why: string };
}

export async function distille(
  figureName: string,
  transcript: ChatTurn[],
  lang: UiLang,
): Promise<Distillation> {
  const res = await fetch("/api/distille", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ figureName, transcript, lang }),
  });
  return readResult<Distillation>(res, lang);
}
