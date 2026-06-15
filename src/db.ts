import Dexie, { type Table } from "dexie";
import type { FigureLang } from "./personas";

// A turn in the conversation. `pending` marks an assistant message still being
// streamed (so it isn't persisted mid-flight in a broken state).
export interface Turn {
  role: "user" | "assistant";
  content: string;
}

// A causerie = one supper with one figure. The figure is denormalized onto the
// row (name, monogram, accent) so a summoned-on-the-fly guest survives even
// though they aren't in the static roster.
export interface Conversation {
  id?: number;
  figureId: string; // roster id, or "summoned:<slug>"
  figureName: string;
  monogram: string;
  accent: string; // hex
  speaks: FigureLang;
  /** The brief that defines this guest (for summoned figures especially). */
  voiceBrief: string;
  /** The question brought to the table, if any. */
  question?: string;
  transcript: Turn[];
  createdAt: number;
  updatedAt: number;
}

// «Le carnet» — a kept idea distilled from a causerie.
export interface CarnetEntry {
  id?: number;
  conversationId?: number;
  figureId: string;
  figureName: string;
  monogram: string;
  accent: string;
  /** 2–3 ideas worth keeping. */
  ideas: string[];
  /** one thing to read / watch / listen to next. */
  nextThing: { label: string; kind: "lire" | "voir" | "ecouter" | "read" | "watch" | "listen"; why: string };
  createdAt: number;
}

export interface Settings {
  id: "app";
  onboarded: boolean;
}

class CauserieDB extends Dexie {
  conversations!: Table<Conversation, number>;
  carnet!: Table<CarnetEntry, number>;
  settings!: Table<Settings, string>;

  constructor() {
    super("la-causerie");
    this.version(1).stores({
      conversations: "++id, figureId, updatedAt",
      carnet: "++id, conversationId, figureId, createdAt",
      settings: "id",
    });
  }
}

export const db = new CauserieDB();

export async function createConversation(
  c: Omit<Conversation, "id" | "createdAt" | "updatedAt">,
): Promise<number> {
  const now = Date.now();
  return db.conversations.add({ ...c, createdAt: now, updatedAt: now });
}

export async function saveTranscript(id: number, transcript: Turn[]): Promise<void> {
  await db.conversations.update(id, { transcript, updatedAt: Date.now() });
}

export async function addCarnet(e: Omit<CarnetEntry, "id" | "createdAt">): Promise<number> {
  return db.carnet.add({ ...e, createdAt: Date.now() });
}

export async function getOnboarded(): Promise<boolean> {
  const s = await db.settings.get("app");
  return !!s?.onboarded;
}

export async function setOnboarded(): Promise<void> {
  await db.settings.put({ id: "app", onboarded: true });
}
