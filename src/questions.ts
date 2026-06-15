// «La question du jour» — a prompt to bring to the table. A curated rotating
// list; the day's pick is deterministic from the date so it's the same all day,
// and turns over at midnight. The user may also bring their own.

export interface DailyQuestion {
  fr: string;
  en: string;
}

export const QUESTIONS: DailyQuestion[] = [
  { fr: "Qu'est-ce qui vaut la peine d'être fait lentement ?", en: "What is worth doing slowly?" },
  { fr: "À quoi reconnaît-on une vie réussie ?", en: "How do you recognize a life well lived?" },
  { fr: "Que faites-vous de votre solitude ?", en: "What do you do with your solitude?" },
  { fr: "Faut-il dire toute la vérité à ceux qu'on aime ?", en: "Should we tell the whole truth to those we love?" },
  { fr: "Qu'est-ce que vous avez cessé de croire ?", en: "What have you stopped believing?" },
  { fr: "Le travail peut-il être une forme d'amour ?", en: "Can work be a form of love?" },
  { fr: "Comment vivre avec ce qu'on ne comprend pas ?", en: "How do we live with what we don't understand?" },
  { fr: "Qu'est-ce qui mérite votre attention, vraiment ?", en: "What truly deserves your attention?" },
  { fr: "Que feriez-vous si vous n'aviez plus peur ?", en: "What would you do if you were no longer afraid?" },
  { fr: "Qu'est-ce qu'on perd en gagnant du temps ?", en: "What do we lose when we save time?" },
  { fr: "Y a-t-il une beauté dans ce qui est abîmé ?", en: "Is there beauty in what is broken?" },
  { fr: "Qu'est-ce que vous voudriez recommencer ?", en: "What would you wish to begin again?" },
  { fr: "Qu'est-ce qui vous rend libre ?", en: "What makes you free?" },
  { fr: "Doit-on pardonner pour avancer ?", en: "Must we forgive in order to move on?" },
  { fr: "Qu'est-ce que le courage, au quotidien ?", en: "What is courage, day to day?" },
  { fr: "Quelle question évitez-vous de vous poser ?", en: "What question do you avoid asking yourself?" },
  { fr: "À quoi ressemblerait une journée parfaitement vécue ?", en: "What would a perfectly lived day look like?" },
  { fr: "Qu'est-ce que vous emporteriez d'aujourd'hui ?", en: "What would you carry forward from today?" },
  { fr: "Pourquoi faisons-nous de l'art ?", en: "Why do we make art?" },
  { fr: "Qu'est-ce qui vous relie aux autres ?", en: "What binds you to others?" },
  { fr: "Faut-il être utile pour avoir de la valeur ?", en: "Must one be useful to have worth?" },
  { fr: "Que diriez-vous à vous-même à vingt ans ?", en: "What would you say to your twenty-year-old self?" },
];

/** Days since the Unix epoch, in local time. Stable across a single day. */
function dayIndex(d = new Date()): number {
  const local = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor(local.getTime() / 86_400_000);
}

/** The deterministic question of the day. */
export function questionOfTheDay(d = new Date()): DailyQuestion {
  return QUESTIONS[dayIndex(d) % QUESTIONS.length];
}
