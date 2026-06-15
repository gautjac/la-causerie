import type { Context } from "@netlify/functions";
import {
  streamReply,
  type ChatTurn,
  type FigureContext,
  type Lang,
} from "./lib/salon.ts";

interface Body {
  lang: Lang;
  figure: FigureContext;
  history: ChatTurn[];
  question?: string;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/**
 * A single in-character turn, streamed token-by-token so the reply lands like
 * real talk. We emit NDJSON: a stream of {"t": "<delta>"} lines as the figure
 * speaks, then a final {"done": true} (or {"error": ...}) line. The client
 * appends each delta to the bubble live; bare newlines double as keepalive.
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
  const figure = body.figure;
  if (!figure?.name || !figure?.voiceBrief) {
    return json({ error: lang === "en" ? "Missing guest." : "Convive manquant." }, 400);
  }
  const history = Array.isArray(body.history) ? body.history : [];

  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => {
        try {
          controller.enqueue(enc.encode(JSON.stringify(obj) + "\n"));
        } catch {
          /* closed */
        }
      };
      try {
        await streamReply(figure, lang, history, body.question, (delta) => {
          send({ t: delta });
        });
        send({ done: true });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : lang === "en"
            ? "Unknown error"
            : "Erreur inconnue";
        send({ error: message });
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
