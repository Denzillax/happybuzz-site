// Reparatur-Log fuer die Beta-Tester: was seit Beta-Start gefixt/gebaut wurde.
// Nutzerfreundlich formuliert (keine Interna), neuste Eintraege zuoberst.
// Pflege: bei jedem sichtbaren Fix hier eine Zeile ergaenzen.
export const REP_LOG = [
  {
    datum: "17. August 2026",
    punkte: [
      "Neue Kategorie 'Tierbedarf & Haustiere' mit 10 Unterkategorien (Hunde bis Aquaristik), dazu Dienstleistungen neu mit Tierbetreuung und Garten & Aussenbereich",
      "Auktionen haben jetzt ein echtes Enddatum mit Countdown (vorher stand dort ein Strich und die Auktion wäre nie zu Ende gegangen)",
      "Gebotsmaske repariert: erstes Gebot ab Startpreis möglich, neue Zeile 'Nächstes Gebot', Limit erhöhen/senken korrekt vorbelegt",
      "Gebotsverlauf: der Höchstbietende steht jetzt immer zuoberst",
      "Verkäufer werden bei jedem Gebot benachrichtigt (Glocke, E-Mail, Push)",
      "Neu: wählbarer Gebotsschritt beim Inserieren (CHF 0.10 / 1.00 / 5.00)",
      "Neu: Beschreibung mit Formatierung (fett, kursiv, Aufzählung, Zwischentitel), auch der Ricardo/Tutti-Import übernimmt sie",
      "Editor-Bug behoben: Cursor sprang beim Leerzeichen an den Textanfang",
      "Service-Inserate verloren beim Bearbeiten ihren Preis, behoben",
      "Pflichtfelder werden beim Veröffentlichen direkt am Feld rot markiert",
      "Eigenes Inserat zeigt eine Leiste mit Bearbeiten-Knopf (mobil unten)",
      "Preise überall korrekt pro Inserat-Typ (Auktionen zeigten teils einen falschen Festpreis oder CHF 0.00)",
      "Zustand 'Gebrauchsspuren' wurde auf dem Handy abgeschnitten, behoben",
      "Infoleiste Zustand/Kategorie/Standort steht auf dem Handy jetzt untereinander statt in drei gequetschten Spalten",
      "Admin: Beta-Zugang erteilen und Konto sperren wirkten nicht (stille Blockade), behoben",
      "Neu: Challenges mit Kategorie-Bedingung, drei neue Challenge-Arten und Challenge-Banner auf der Startseite",
      "Favoriten: Verkaufte und beendete Inserate liegen ausgegraut in einer eigenen Sektion, gelöschte verschwinden ganz",
    ],
  },
  {
    datum: "16. August 2026 (Go-Live)",
    punkte: [
      "beedaro.ch ist live, Registrierung und Anmeldung laufen",
      "Alle Mails kommen von noreply@beedaro.ch im Beedaro-Design mit Logo",
      "Push-Benachrichtigungen aufs Handy (aktivieren in Einstellungen → Benachrichtigungen)",
      "Als App installierbar (Zum Home-Bildschirm) mit Start-Animation",
      "QR-Rechnungen bankkonform (strukturierte Adressen, Schweizer Kreuz)",
      "Mobile-Fixes: Einstellungs-Reiter, Bildergalerie mit Wischen, Kaufleiste, Karten-Darstellung",
      "Admin-Bereich lädt in rund einer Sekunde statt zweistelliger Sekunden",
    ],
  },
];
