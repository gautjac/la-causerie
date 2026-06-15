import type { Context } from "@netlify/functions";
import { distill, type ChatTurn, type Lang } from "./lib/salon.ts";

interface Body {
  lang: Lang;
  figureName: string;
  transcript: ChatTurn[];
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/**
 * Distil a causerie into «le carnet» (opus). Streams NDJSON: keepalive
 * heartbeats while thinking, then a final {"result": ...} line.
 */
export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const lang: Lang = body.lang === "en" ? "en" : "fr";
  const figureName = (body.figureName ?? "").trim() || (lang === "en" ? "your guest" : "votre convive");
  const transcript = Array.isArray(body.transcript) ? body.transcript : [];
  if (transcript.filter((t) => t.role === "assistant").length < 1) {
    return json(
      { error: lang === "en" ? "Talk a little first, then distil." : "Causez un peu, puis distillez." },
      400,
    );
  }

  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let done = false;
      const beat = setInterval(() => {
        if (!done) {
          try {
            controller.enqueue(enc.encode("\n"));
          } catch {
            /* closed */
          }
        }
      }, 3000);
      try {
        const result = await distill(figureName, lang, transcript);
        done = true;
        clearInterval(beat);
        controller.enqueue(enc.encode(JSON.stringify({ result }) + "\n"));
      } catch (err) {
        done = true;
        clearInterval(beat);
        const message =
          err instanceof Error ? err.message : lang === "en" ? "Unknown error" : "Erreur inconnue";
        controller.enqueue(enc.encode(JSON.stringify({ error: message }) + "\n"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
};
