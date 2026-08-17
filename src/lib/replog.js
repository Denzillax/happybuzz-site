// Reparatur-Log fuer die Beta-Tester: was seit Beta-Start gefixt/gebaut wurde.
// Nutzerfreundlich formuliert (keine Interna), neuste Eintraege zuoberst.
// Pflege: bei jedem sichtbaren Fix hier eine Zeile ergaenzen.
// typ: "neu" (Feature) | "fix" (Reparatur) — bereich: kurzes Label fuers Chip.
// melder (optional): wer den Punkt gemeldet hat (nur setzen, wenn bekannt).
// Das Top-Melder-Ranking auf /beta zaehlt DIESE melder-Eintraege (nicht die
// beta_feedback-Tabelle): so zaehlen nur Meldungen, die zu einem Fix/Feature
// gefuehrt haben, und auch Meldungen ausserhalb der Plattform (WhatsApp etc.).
// Ranking: Anzahl Log-Eintraege pro Melder, absteigend (Gleichstand: alphabetisch)
export function melderRanking() {
  const zaehl = {};
  for (const tag of REP_LOG) {
    for (const p of tag.punkte) {
      if (p.melder) zaehl[p.melder] = (zaehl[p.melder] || 0) + 1;
    }
  }
  return Object.entries(zaehl)
    .map(([melder, meldungen]) => ({ melder, meldungen }))
    .sort((a, b) => b.meldungen - a.meldungen || a.melder.localeCompare(b.melder));
}

export const REP_LOG = [
  {
    datum: "17. August 2026",
    punkte: [
      { typ: "fix", bereich: "Startseite", text: "Einheitlicher Look: Hero jetzt im hellen Creme, Challenge-Banner und Bee-Impact mit gleichen Abständen (40px) und weissen Boxen mit Rahmen" },
      { typ: "fix", bereich: "Admin", text: "Admin-Dashboard blieb beim Laden hängen, sobald die erste Bewertung existierte, behoben" },
      { typ: "fix", bereich: "Inserieren", text: "Versandkosten gingen verloren, wenn man die Vorauswahl (Gewicht/Lieferzeit) einfach übernahm statt anzuklicken. Der Post-Tarif wird jetzt automatisch übernommen, betroffene Inserate wurden repariert", melder: "Melani" },
      { typ: "fix", bereich: "Texte", text: "Footer-Slogan gestrafft: 'Secondhand mit Haltung' statt 'Secondhand, aber mit Haltung'", melder: "Oli" },
      { typ: "fix", bereich: "Texte", text: "Unsere Geschichte umformuliert: 'Gebrauchte Dinge verdienen mehr als ein zweites Leben. Sie verdienen einen besseren Marktplatz.' (vorher stand dort 'Notlösung')", melder: "Oli" },
      { typ: "fix", bereich: "Glocke", text: "Benachrichtigungen: Ankündigungen zeigen jetzt den ganzen Text (vorher auf eine Zeile abgeschnitten) und ein hinterlegter Link ist als 'Öffnen' sichtbar" },
      { typ: "neu", bereich: "Mobile", text: "Die Benachrichtigungs-Glocke ist jetzt auch auf dem Handy im Header (vorher nur am Desktop)" },
      { typ: "fix", bereich: "Mobile", text: "Der gelbe Inserieren-Knopf in der unteren Leiste ist grösser und besser zu treffen" },
      { typ: "fix", bereich: "Login", text: "AGB- und Datenschutz-Links bei der Registrierung führten ins Leere, jetzt öffnen sie die richtigen Seiten", melder: "Christian" },
      { typ: "neu", bereich: "Startseite", text: "Hero-Slides lassen sich auf dem Handy per Wischen wechseln" },
      { typ: "neu", bereich: "Kategorien", text: "Neue Kategorie 'Tierbedarf & Haustiere' mit 10 Unterkategorien (Hunde bis Aquaristik), dazu Dienstleistungen neu mit Tierbetreuung und Garten & Aussenbereich", melder: "Melani" },
      { typ: "fix", bereich: "Auktionen", text: "Auktionen haben jetzt ein echtes Enddatum mit Countdown (vorher stand dort ein Strich und die Auktion wäre nie zu Ende gegangen)", melder: "Ivan" },
      { typ: "fix", bereich: "Auktionen", text: "Gebotsmaske repariert: erstes Gebot ab Startpreis möglich, neue Zeile 'Nächstes Gebot', Limit erhöhen/senken korrekt vorbelegt", melder: "Ivan" },
      { typ: "fix", bereich: "Auktionen", text: "Gebotsverlauf: der Höchstbietende steht jetzt immer zuoberst", melder: "Ivan" },
      { typ: "neu", bereich: "Auktionen", text: "Verkäufer werden bei jedem Gebot benachrichtigt (Glocke, E-Mail, Push)" },
      { typ: "neu", bereich: "Auktionen", text: "Wählbarer Gebotsschritt beim Inserieren (CHF 0.10 / 1.00 / 5.00)" },
      { typ: "neu", bereich: "Inserieren", text: "Beschreibung mit Formatierung (fett, kursiv, Aufzählung, Zwischentitel), auch der Ricardo/Tutti-Import übernimmt sie" },
      { typ: "fix", bereich: "Inserieren", text: "Editor-Bug behoben: Cursor sprang beim Leerzeichen an den Textanfang", melder: "Melani" },
      { typ: "fix", bereich: "Inserieren", text: "Service-Inserate verloren beim Bearbeiten ihren Preis, behoben" },
      { typ: "fix", bereich: "Inserieren", text: "Pflichtfelder werden beim Veröffentlichen direkt am Feld rot markiert" },
      { typ: "neu", bereich: "Inserate", text: "Eigenes Inserat zeigt eine Leiste mit Bearbeiten-Knopf (mobil unten)" },
      { typ: "fix", bereich: "Inserate", text: "Preise überall korrekt pro Inserat-Typ (Auktionen zeigten teils einen falschen Festpreis oder CHF 0.00)" },
      { typ: "fix", bereich: "Mobile", text: "Zustand 'Gebrauchsspuren' wurde auf dem Handy abgeschnitten, behoben" },
      { typ: "fix", bereich: "Mobile", text: "Infoleiste Zustand/Kategorie/Standort steht auf dem Handy jetzt untereinander statt in drei gequetschten Spalten" },
      { typ: "fix", bereich: "Admin", text: "Beta-Zugang erteilen und Konto sperren wirkten nicht (stille Blockade), behoben" },
      { typ: "neu", bereich: "Challenges", text: "Challenges mit Kategorie-Bedingung, drei neue Challenge-Arten und Challenge-Banner auf der Startseite" },
      { typ: "neu", bereich: "Favoriten", text: "Verkaufte und beendete Inserate liegen ausgegraut in einer eigenen Sektion, gelöschte verschwinden ganz" },
    ],
  },
  {
    datum: "16. August 2026 (Go-Live)",
    punkte: [
      { typ: "neu", bereich: "Go-Live", text: "beedaro.ch ist live, Registrierung und Anmeldung laufen" },
      { typ: "neu", bereich: "Mails", text: "Alle Mails kommen von noreply@beedaro.ch im Beedaro-Design mit Logo" },
      { typ: "neu", bereich: "Push", text: "Push-Benachrichtigungen aufs Handy (aktivieren in Einstellungen → Benachrichtigungen)" },
      { typ: "neu", bereich: "App", text: "Als App installierbar (Zum Home-Bildschirm) mit Start-Animation" },
      { typ: "fix", bereich: "Rechnungen", text: "QR-Rechnungen bankkonform (strukturierte Adressen, Schweizer Kreuz)" },
      { typ: "fix", bereich: "Mobile", text: "Einstellungs-Reiter, Bildergalerie mit Wischen, Kaufleiste, Karten-Darstellung" },
      { typ: "fix", bereich: "Admin", text: "Admin-Bereich lädt in rund einer Sekunde statt zweistelliger Sekunden" },
    ],
  },
];
