// Poker-Hilfen fuer die Anzeige. Karten 0..51: rang = c % 13 (0 = Zwei, 12 = Ass), farbe = c / 13.
export const RANG = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
export const FARBE = ["♠", "♥", "♦", "♣"];

export function karte(c) {
  if (c == null) return null;
  const farbe = Math.floor(c / 13);
  return { rang: RANG[c % 13], farbe: FARBE[farbe], rot: farbe === 1 || farbe === 2 };
}

export const PHASEN = { preflop: "Vor dem Flop", flop: "Flop", turn: "Turn", river: "River", fertig: "Fertig" };

export function aktionText(e, nameVonSeat) {
  const wer = nameVonSeat(e.seat);
  switch (e.aktion) {
    case "small_blind": return `${wer} setzt Small Blind ${e.betrag}`;
    case "big_blind": return `${wer} setzt Big Blind ${e.betrag}`;
    case "fold": return `${wer} passt`;
    case "check": return `${wer} schiebt`;
    case "call": return `${wer} geht mit (${e.betrag})`;
    case "raise": return `${wer} erhöht (+${e.betrag})`;
    case "allin": return `${wer} geht All-in (${e.betrag})`;
    case "flop": return "Flop liegt";
    case "turn": return "Turn liegt";
    case "river": return "River liegt";
    case "ende": return e.rake ? `Hand beendet, Rake ${e.rake}` : "Hand beendet";
    default: return e.aktion;
  }
}

export function restzeit(deadline) {
  if (!deadline) return "";
  const ms = new Date(deadline) - Date.now();
  if (ms <= 0) return "abgelaufen";
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}
