import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { LangProvider } from "./i18n";
import { db, getOnboarded, setOnboarded, type Conversation } from "./db";
import { Onboarding } from "./components/Onboarding";
import { Salon, type SeatedGuest } from "./components/Salon";
import { Table } from "./components/Table";
import { Carnet } from "./components/Carnet";

type View =
  | { name: "salon" }
  | { name: "table"; guest: SeatedGuest; question?: string; existing?: Conversation | null }
  | { name: "carnet" };

function Shell() {
  const [onboarded, setOnb] = useState<boolean | null>(null);
  const [view, setView] = useState<View>({ name: "salon" });

  const carnetCount = useLiveQuery(() => db.carnet.count(), [], 0);

  useEffect(() => {
    getOnboarded().then(setOnb);
  }, []);

  if (onboarded === null) {
    return <div className="grid h-[100dvh] place-items-center text-cream-muted">…</div>;
  }

  function convToGuest(conv: Conversation): SeatedGuest {
    return {
      figureId: conv.figureId,
      figureName: conv.figureName,
      monogram: conv.monogram,
      accent: conv.accent,
      speaks: conv.speaks,
      voiceBrief: conv.voiceBrief,
      titleFr: conv.figureName,
      titleEn: conv.figureName,
    };
  }

  return (
    <>
      {!onboarded && (
        <Onboarding
          onDone={() => {
            void setOnboarded();
            setOnb(true);
          }}
        />
      )}

      {view.name === "salon" && (
        <Salon
          carnetCount={carnetCount}
          onOpenCarnet={() => setView({ name: "carnet" })}
          onSeat={(guest, question) => setView({ name: "table", guest, question })}
        />
      )}

      {view.name === "table" && (
        <Table
          guest={view.guest}
          question={view.question}
          existing={view.existing}
          onLeave={() => setView({ name: "salon" })}
          onDistilled={() => {
            /* live carnet count updates via useLiveQuery */
          }}
        />
      )}

      {view.name === "carnet" && (
        <Carnet
          onBack={() => setView({ name: "salon" })}
          onResume={(conv) =>
            setView({ name: "table", guest: convToGuest(conv), existing: conv })
          }
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <LangProvider>
      <Shell />
    </LangProvider>
  );
}
