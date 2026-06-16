// Reine Mahntext-Erzeugung (keine UI, kein Supabase). amount/dueDate/daysOverdue kommen vorformatiert rein.
const TEXTS = {
  1: {
    subject: (ref) => `Erinnerung: offene Gebührenrechnung ${ref}`,
    body: ({ sellerName, ref, amount, dueDate }) =>
`Hallo ${sellerName},

deine Gebührenrechnung ${ref} über CHF ${amount} war am ${dueDate} fällig.

Bitte begleiche den Betrag in den nächsten Tagen über die QR-Rechnung in deinem Konto. Falls du bereits bezahlt hast, ignoriere diese Nachricht.

Besten Dank.
Dein BEEDARO-Team`,
  },
  2: {
    subject: () => `2. Mahnung: Inserate werden bald pausiert`,
    body: ({ sellerName, ref, amount, dueDate, daysOverdue }) =>
`Hallo ${sellerName},

deine Gebührenrechnung ${ref} über CHF ${amount} ist seit ${daysOverdue} Tagen offen (fällig am ${dueDate}).

Bitte begleiche den Betrag innerhalb von 7 Tagen. Andernfalls pausieren wir deine aktiven Inserate, bis die Zahlung eingegangen ist.

Zahlung per QR-Rechnung in deinem Konto.
Dein BEEDARO-Team`,
  },
  3: {
    subject: () => `Letzte Mahnung: Inserate pausiert`,
    body: ({ sellerName, ref, amount, daysOverdue }) =>
`Hallo ${sellerName},

deine Gebührenrechnung ${ref} über CHF ${amount} ist seit ${daysOverdue} Tagen offen. Wir haben deine aktiven Inserate jetzt pausiert.

Sobald deine Zahlung eingegangen ist, schalten wir die Inserate wieder frei. Bitte begleiche den Betrag per QR-Rechnung in deinem Konto.

Bei Fragen: support@happybuzz.ch
Dein BEEDARO-Team`,
  },
};

export function buildDunningEmail({ level, sellerName, ref, amount, dueDate, daysOverdue }) {
  const t = TEXTS[level] || TEXTS[1];
  return {
    subject: t.subject(ref),
    body: t.body({ sellerName, ref, amount, dueDate, daysOverdue }),
    template: `reminder_${level}`,
  };
}

export const DUNNING_GAP_DAYS = 7; // Tage zwischen den Mahnstufen
