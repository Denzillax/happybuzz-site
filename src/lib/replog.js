// Reparatur-Log fuer die Beta-Tester: was seit Beta-Start gefixt/gebaut wurde.
// Nutzerfreundlich formuliert (keine Interna), neuste Eintraege zuoberst.
// Pflege: bei jedem sichtbaren Fix hier eine Zeile ergaenzen.
// typ: "neu" (Feature) | "fix" (Reparatur) — bereich: kurzes Label fuers Chip.
// melder (optional): wer den Punkt gemeldet hat (nur setzen, wenn bekannt).
// Das Top-Melder-Ranking auf /beta zaehlt DIESE melder-Eintraege (nicht die
// beta_feedback-Tabelle): so zaehlen nur Meldungen, die zu einem Fix/Feature
// gefuehrt haben, und auch Meldungen ausserhalb der Plattform (WhatsApp etc.).
// Ranking: Anzahl Log-Eintraege pro Melder, absteigend (Gleichstand: alphabetisch).
// Der Owner (Denis) bleibt als melder in den Eintraegen dokumentiert, zaehlt
// aber im Tester-Ranking nicht mit — die Rangliste gehoert den Testern.
export function melderRanking() {
  const zaehl = {};
  for (const tag of REP_LOG) {
    for (const p of tag.punkte) {
      if (p.melder && p.melder !== "Denis") zaehl[p.melder] = (zaehl[p.melder] || 0) + 1;
    }
  }
  return Object.entries(zaehl)
    .map(([melder, meldungen]) => ({ melder, meldungen }))
    .sort((a, b) => b.meldungen - a.meldungen || a.melder.localeCompare(b.melder));
}

export const REP_LOG = [
  {
    datum: "31. August 2026",
    punkte: [
      { typ: "fix", bereich: "Inserat", text: "Nur-Abholung-Inserate zeigten trotzdem eine Lieferzeile mit Versandart, die Zeile erscheint jetzt nur noch, wenn Versand wirklich aktiviert ist", melder: "Michael" },
      { typ: "fix", bereich: "Inserieren", text: "Die IBAN wird beim Veröffentlichen nur noch verlangt, wenn Banküberweisung als Zahlart gewählt ist. Bei Bar oder TWINT gibt es nichts zu überweisen", melder: "Michael" },
      { typ: "neu", bereich: "Inserieren", text: "Angefangene Inserate überleben jetzt einen Neuladen der Seite: die Eingaben werden automatisch als Entwurf gesichert und beim nächsten Besuch wiederhergestellt (Fotos bitte neu anhängen)", melder: "Michael" },
      { typ: "neu", bereich: "Inserieren", text: "Zu grosse Fotos werden beim Hochladen automatisch verkleinert statt mit einer 5-MB-Meldung abgelehnt. Handy-Fotos einfach direkt hochladen", melder: "Tacocat" },
      { typ: "fix", bereich: "Startseite", text: "Die Laufschrift läuft jetzt ganz oben direkt unter dem Header von Rand zu Rand, statt mitten auf der Seite die Kacheln zu trennen", melder: "Tacocat" },
      { typ: "neu", bereich: "Design", text: "Inserieren-Knopf als gelbe Pille direkt im Header neben der Suche, ein Klick zum Formular", melder: "Michael" },
      { typ: "neu", bereich: "Hive", text: "Neue Erklärbox im Hive: Pollen kommen aus Aktivität und bestimmen dein Level, Blüten entstehen aus dem Bee-Impact deiner Verkäufe (100 Blüten = 1 Pollen), Nektar ist die Belohnungswährung. Pollen ohne Blüten sind also völlig normal", melder: "Tacocat" },
      { typ: "fix", bereich: "KI", text: "Die KI-Inseraterkennung erfindet kein Zubehör mehr, das ein Modell 'üblicherweise hat' (z.B. Fernbedienung), erfindet umgekehrt auch keine Gebrauchsspuren bei makellosen Artikeln und erwähnt, wenn ein Gerät sichtbar in Betrieb ist", melder: "Melani" },
      { typ: "neu", bereich: "Admin", text: "Mitarbeiter mit Rolle bekommen jetzt Freigabe-Anfragen und Admin-Alarme per Glocke, Mail und Push, und können wartende Inserate direkt auf der Inserat-Seite freigeben", melder: "Melani" },
    ],
  },
  {
    datum: "28. August 2026",
    punkte: [
      { typ: "neu", bereich: "Mails", text: "Alle Beedaro-Mails im neuen hellen Design: weisse Karte, runder gelber Knopf, und bei Mails zu einem Inserat ist jetzt automatisch Foto und Titel des Artikels als kleine Karte dabei" },
      { typ: "neu", bereich: "Auktionen", text: "Das Auktionsende meldet sich jetzt per Mail und Push: der Gewinner ('Auktion gewonnen, jetzt bezahlen'), der Verkäufer ('Verkauft für CHF X'), und endet eine Auktion ohne Gebote, erfährt es der Verkäufer ebenfalls. Vorher gab es nur die Glocke auf der Seite" },
      { typ: "fix", bereich: "Mails", text: "Umlaute in Mails repariert: die Mail-Vorlage deklariert jetzt die Zeichenkodierung, und mehrere Mail-Texte, die aus Vorsicht 'ae/oe/ue' schrieben, verwenden wieder echte Umlaute", melder: "Denis" },
    ],
  },
  {
    datum: "24. / 25. August 2026",
    punkte: [
      { typ: "neu", bereich: "Design", text: "Grosser Neuanstrich: Beedaro ist jetzt hell, flach und aufgeräumt. Weisse Flächen, weiche Ecken, runde gelbe Knöpfe, neue Suchleiste als runde Pille, dichteres Inserat-Raster mit feinen Trennlinien und farbigen Typ-Chips (Festpreis gelb, Auktion blau, Miete violett, Gratis grün, Service orange)" },
      { typ: "neu", bereich: "Gebühren", text: "Gebühren-Deckel: kein Verkauf kostet mehr als CHF 200, egal wie teuer der Artikel (Ricardo: 290). Unter CHF 20 bleibt es gebührenfrei", melder: "Denis" },
      { typ: "neu", bereich: "Inserate", text: "Karten zeigen jetzt 'Endet bald' (unter 24h Restzeit) und 'Hot' (viele Aufrufe pro Tag) direkt auf dem Foto" },
      { typ: "fix", bereich: "Inserat", text: "Nachträglich ergänzte Informationen (z.B. aus Ricardo-Importen) erscheinen als eigener, datierter Block statt angeklebt am Beschreibungstext", melder: "Denis" },
      { typ: "fix", bereich: "Handy", text: "Responsive-Runde übers ganze Sortiment: kein seitliches Wackeln mehr (der Kopfbereich war 18px zu breit), Preise und Datumszeilen brechen sauber um, Kaufknöpfe bleiben einzeilig, 'Lieferung & Bezahlung' stapelt auf schmalen Bildschirmen", melder: "Denis" },
      { typ: "fix", bereich: "Login", text: "Login und Registrierung im neuen Design, mit kleinerem Logo auf dem Handy und sauberen Umbrüchen", melder: "Denis" },
      { typ: "fix", bereich: "Einstellungen", text: "Die Profil-Vorschau in den Einstellungen zeigte drei Nullen (veraltete Kopie ohne echte Daten). Der Knopf führt jetzt direkt aufs echte öffentliche Profil", melder: "Denis" },
    ],
  },
  {
    datum: "21. August 2026",
    punkte: [
      { typ: "fix", bereich: "Kaufen", text: "Sofortkauf war seit dem Varianten-Update blockiert (Datenbank-Funktionskonflikt: alte und neue Kauf-Funktion existierten parallel, die Datenbank konnte sich nicht entscheiden). Alte Versionen entfernt, alle Kauf-Wege wieder verifiziert", melder: "Denis" },
      { typ: "fix", bereich: "Profil", text: "Verkäuferprofil aufgeräumt: Die Bewertungsverteilung (Positiv/Neutral/Negativ) lief mobil rechts aus dem Bild, dort steht jetzt kompakt 'X Bewertungen · Y% positiv'; die widersprüchliche Verkaufsrate (1 Verkauf, 0%) ist raus und die Statistik-Kacheln sind eine schlanke Zeile ('1 Verkauf · Ø 1 Min Antwortzeit'); Tabs einzeilig, 'Bewert.' ausgeschrieben, Level-Badge dezenter neben dem Gründungsmitglied, Beta-Knopf mit Randabstand", melder: "Denis" },
    ],
  },
  {
    datum: "18. August 2026",
    punkte: [
      { typ: "neu", bereich: "Mails & Push", text: "Alle Benachrichtigungs-Schalter haben jetzt ein echtes Feature: Auktion endet bald (Vorlauf 5/10/30 Min wählbar), Inserat läuft ab, Bewertungs-Erinnerung, monatlicher Verkaufsbericht, Favorit-Preisänderung und Favorit verkauft" },
      { typ: "neu", bereich: "Suche", text: "Suchen lassen sich speichern ('Suche speichern' auf der Suchseite, verwalten unter Favoriten → Suchen); neue Treffer melden wir stündlich per Glocke, Mail oder Push" },
      { typ: "neu", bereich: "Admin", text: "Der Admin bekommt jetzt sofort Mail und Push bei Meldungen, geflaggten Konten, Freigabe-Inseraten und Bewerbungen, dazu jeden Morgen einen Report mit Aktivität und offenen Posten" },
      { typ: "fix", bereich: "Mieten", text: "Wochen- und Monatspreise wurden pro Tag verrechnet (11 Tage à 50/Woche ergaben 550 statt 100), Formel korrigiert und die betroffene Bestellung angepasst" },
      { typ: "fix", bereich: "Kaufen", text: "Sofortkauf und Gebote sind ohne hinterlegte Lieferadresse nicht mehr möglich (vorher konnte man ohne Adresse kaufen)", melder: "Armend" },
      { typ: "neu", bereich: "Bestellung", text: "Die QR-Rechnung ist jetzt bei jedem Kauf für beide Seiten sichtbar, auch für den Verkäufer" },
      { typ: "fix", bereich: "Design", text: "Kategorien-Menü: aktive Einträge jetzt hellbeige mit gelbem Akzent statt dunkelbeige mit grünem" },
      { typ: "fix", bereich: "App", text: "Installierte App blieb auf einer alten Version hängen, neue Versionen übernehmen jetzt sofort (App einmal komplett schliessen und neu öffnen)", melder: "Armend" },
      { typ: "neu", bereich: "Admin", text: "Neuer Tab Kommunikation: Banner, Rundruf und Versand-Historie an einem Ort" },
      { typ: "fix", bereich: "Rechnung", text: "Rechnung schreibt jetzt alles aus: Versandart (z.B. 'Versand: Paket B-Post'), bei Mieten die Mietdauer und die Kaution als eigene Position, Beträge auf Bestellseite, Rechnung und QR-Zahlteil überall gleich" },
      { typ: "fix", bereich: "Inserieren", text: "Bei 'nur Abholung' verlangte das System eine Zahlungsart, die man nirgends wählen konnte. Jetzt gibt es die Schalter (Barzahlung, TWINT, Überweisung) direkt bei der Abholung, Barzahlung ist vorausgewählt" },
      { typ: "neu", bereich: "Startseite", text: "Grosse Laufschrift als neues Kampagnen-Element (Admin → Kommunikation): eigener Text, Farbe und Platzierung (Startseite oder alle Seiten)" },
      { typ: "fix", bereich: "Design", text: "Banner über dem Header: grössere Schrift, ohne Megafon-Icon; Banner-Einstellungen im Admin aufgeräumt mit Live-Vorschau zuoberst" },
      { typ: "fix", bereich: "Desktop", text: "Auf grossen Bildschirmen wirkte alles klein und verloren: die Seite zoomt jetzt gestuft (+10% ab Laptop, +25% ab 27 Zoll), und Challenge- plus Bee-Impact-Box sind bündig zum Hero" },
      { typ: "fix", bereich: "Admin", text: "Der Status-Wechsler im Feedback-Tab schrieb ins Leere (Sprach-Konflikt mit der Datenbank), behoben; alle erledigten Meldungen sind jetzt abgehakt und mit Fix-Notiz versehen" },
      { typ: "fix", bereich: "Login", text: "Schriften auf der Login-Seite vergrössert (Lesetexte 14px, Feldbeschriftungen 11px), dazu wirkt der neue Seiten-Zoom auf grossen Bildschirmen", melder: "Christian" },
      { typ: "fix", bereich: "Design", text: "Das dunkle Beige ist überall durch das hellere ersetzt (32 Stellen auf der ganzen Seite), der Look ist jetzt durchgehend hell" },
      { typ: "neu", bereich: "Rechtliches", text: "Handelsregister-Eintrag ergänzt: UID CHE-237.380.784 im Impressum, Footer und auf den Gebühren-Rechnungen; Impressum, AGB und Datenschutz sind auch während Beta-Sperre und Wartung erreichbar" },
      { typ: "fix", bereich: "Nachrichten", text: "Öffentliche Fragen zu Inseraten erscheinen jetzt auch im Nachrichten-Tab (mit Inserat-Bild und 'Öffentlich'-Chip), vorher waren sie nur auf der Inserat-Seite zu finden", melder: "Denis" },
      { typ: "fix", bereich: "Nachrichten", text: "Fragen-Bereich unterm Inserat neu gestaltet: Absendername steht jetzt an jeder Nachricht (auch an den eigenen), Verkäufer-Chip im Beedaro-Look, richtiger Senden-Knopf statt Icon" },
      { typ: "fix", bereich: "Nachrichten", text: "Chat-Nachrichten und Preisvorschläge aus dem Nachrichten-Tab lösten keine Mail/Push aus, jetzt zentral für alle Sendewege" },
      { typ: "neu", bereich: "Design", text: "Neuer 'Cutting Prices, Saving Flowers'-Badge in BEEDARO-Farben: eigene 404-Seite (Diese Seite wurde weggeschnitten) und Stempel auf der Bee-Rate-Box unter So funktioniert's" },
      { typ: "neu", bereich: "Design", text: "Easter Egg eingebaut: Gelegentlich fliegt Besuch mit Flügelschlag durchs Bild. Anklicken lohnt sich, sie hat was zu sagen" },
      { typ: "fix", bereich: "Design", text: "Gelbe Text-Marker in Überschriften (Über uns, Impact, So funktioniert's, Startseite) verdeckten bei Zeilenumbruch die Unterlängen der Zeile darüber, Marker liegt jetzt hinter der Schrift", melder: "Denis" },
      { typ: "fix", bereich: "Inserieren", text: "Versand-Dialog: Beim Wechsel der Versandart (z.B. Paket zu Brief) war keine Gewichtsstufe markiert und der alte Preis blieb stehen, jetzt ist immer die erste Stufe mit richtigem Preis vorgewählt", melder: "Denis" },
      { typ: "neu", bereich: "Inserieren", text: "Auf dem Handy gibt es beim Inserieren einen Fotografieren-Knopf, der direkt die Kamera öffnet statt den Umweg über die Galerie" },
      { typ: "neu", bereich: "Inserieren", text: "Bei Abholung ist die Abholadresse wählbar: Hauptadresse (Standard) oder eine der Lieferadressen aus den Einstellungen; der Käufer sieht die gewählte Adresse auf der Bestellseite" },
      { typ: "neu", bereich: "Konto", text: "Bei der Registrierung kann der Anzeigename gleich mitbestimmt werden (optional, Standard ist der Vorname)" },
      { typ: "fix", bereich: "Inserieren", text: "Die Inserieren-Seite sah anders aus als der Rest der Website, jetzt im Katalog-Stil: eckige Karten mit Ink-Rahmen, Mono-Labels, gelbe Knöpfe mit Schatten", melder: "Denis" },
      { typ: "neu", bereich: "Nachrichten", text: "Gespräche lassen sich entfernen: Desktop per Papierkorb, Handy per Wisch nach links. Nur bei dir ausgeblendet, die Gegenseite behält den Verlauf; unten in der Liste per 'Ausgeblendete Gespräche' wiederherstellbar, neue Nachricht holt sie automatisch zurück" },
      { typ: "neu", bereich: "Nachrichten", text: "Gespräche zu verkauften oder nicht mehr aktiven Inseraten sind ausgegraut mit Chip (Verkauft / Nicht mehr aktiv), bleiben aber lesbar" },
      { typ: "neu", bereich: "Nachrichten", text: "Vier Filter-Pills (Alle, Aktiv, Ungelesen, Archiv mit Zähler); entfernte Gespräche liegen im Archiv-Pill statt im Aufklapper. Dazu eine Suchlupe, die Titel, Namen und alle Nachrichtentexte durchsucht und die Fundstelle in der Vorschau zeigt" },
      { typ: "neu", bereich: "Admin", text: "Analytik zeigt live, wer gerade online ist: angemeldete Nutzer mit Name und aktuellem Seitenbereich, Gäste anonym gezählt; aktualisiert sich in Echtzeit (Hinweis dazu in der Datenschutzerklärung ergänzt)" },
      { typ: "neu", bereich: "Admin", text: "Besuchsverlauf in der Analytik: Seitenaufrufe werden protokolliert (wer, wo, wann; Gäste anonym) und nach 90 Tagen automatisch gelöscht; bei vielen Nutzern zeigt die Live-Ansicht eine Bereichs-Zusammenfassung statt endloser Namenslisten" },
      { typ: "neu", bereich: "Startseite", text: "Sechs Neuerungen: Zahlen-Leiste unterm Hero (Exponate, Mitglieder, Bee-Impact), fünf Format-Kacheln als Direkteinstieg (Festpreis bis Service), Auktions-Sektion 'Endet bald' mit tickendem Countdown, Neu-Chip auf Tierbedarf, Gründungsmitglied-Hinweis, klickbare Warum-wir-Karten" },
      { typ: "fix", bereich: "Startseite", text: "Entladen und neu sortiert: Inserate kommen jetzt viel früher (Endet bald und Neu eingestellt direkt nach den Kategorien), Challenge und Bee-Impact liegen als Zwischenstopps zwischen den Reihen; Kategorien als eine kuratierte Zeile (mobil wischbar); So funktioniert's und Warum wir sind eine Sektion", melder: "Denis" },
      { typ: "fix", bereich: "Startseite", text: "Mobile: Inserat-Reihen sind jetzt wischbar (grössere Karten, kürzere Seite), Kategorien-Zeile zeigt am Handy alle Kategorien, und die Seite kann nicht mehr seitlich verrutschen (Überlauf-Sicherung)", melder: "Denis" },
      { typ: "fix", bereich: "Startseite", text: "Fehlermeldung beim Laden der Startseite behoben (Hydration-Konflikt durch ein Sonderzeichen im Stil der Format-Kacheln)", melder: "Denis" },
      { typ: "neu", bereich: "Startseite", text: "Challenge der Woche auffälliger: Bee-Loud-Marke (Biene mit Megafon) klebt als wippender Sticker auf dem Band" },
      { typ: "fix", bereich: "Inserieren", text: "Mobile: Die Leiste mit Vorschau/Entwurf/Veröffentlichen wurde von der unteren Navigation verdeckt und brach in zwei Zeilen um, jetzt sitzt sie kompakt in einer Zeile direkt über der Navigation", melder: "Denis" },
      { typ: "neu", bereich: "Inserieren", text: "Später veröffentlichen: Zeitpunkt wählbar, das Inserat geht nach der Freigabe zur geplanten Zeit automatisch live (mit Benachrichtigung); in Meine Inserate als 'Geplant' sichtbar, jederzeit sofort veröffentlichbar" },
      { typ: "neu", bereich: "Inserieren", text: "KI-Erkennung: 'Mit KI ausfüllen' liest die Fotos (bis zu 5) und füllt Titel, Beschreibung, Zustand und Kategorie; dazu eine Preisschätzung als Richtwert. Eigene Texte werden nie überschrieben" },
      { typ: "fix", bereich: "Inserieren", text: "Die KI bewertete den Zustand zu wohlwollend und erfand Beigaben (Module, Verpackung). Jetzt zählt nur, was auf dem Foto sichtbar ist: Mängel wie Vergilbung oder verblasste Schriftzüge werden benannt und drücken den Zustand", melder: "Denis" },
      { typ: "neu", bereich: "Inserieren", text: "KI-Titel und KI-Text erzeugen auf Knopfdruck eine neue, anders formulierte Variante, auch wenn schon ein Text dasteht" },
      { typ: "fix", bereich: "Inserieren", text: "KI-Beschreibung kommt jetzt sauber formatiert statt als Textblock: kurze Einleitung, Zwischentitel 'Zustand' und 'Lieferumfang' mit Aufzählung, direkt im Beschreibungs-Editor weiterbearbeitbar", melder: "Denis" },
      { typ: "fix", bereich: "Auktion", text: "Das Feld 'Mindestpreis (optional)' ist entfernt: es hatte keine Funktion (kein Einfluss auf Gebote oder Auktionsende), Sofortkauf hat jetzt die volle Breite", melder: "Denis" },
      { typ: "fix", bereich: "Inserieren", text: "Die KI liest jetzt bis zu 5 Fotos statt nur das Cover: Mängel auf Detailfotos, Modellnummern auf der Rückseite und Zubehör auf Extra-Bildern fliessen in Beschreibung und Zustand ein", melder: "Denis" },
      { typ: "fix", bereich: "Admin", text: "Kommunikations-Tab neu aufgebaut: Bereiche Banner, Laufschrift, Rundruf und Historie statt gequetschter Karten; die Laufschrift-Vorschau ist jetzt exakt die echte Laufschrift in Originalgrösse, die Historie hat Filter", melder: "Denis" },
      { typ: "fix", bereich: "Startseite", text: "Die grosse Laufschrift läuft jetzt mit konstantem Tempo (vorher hing die Geschwindigkeit von der Textlänge ab) und das Tempo ist im Admin in drei Stufen einstellbar: Langsam, Normal, Schnell", melder: "Denis" },
      { typ: "fix", bereich: "Mails & Push", text: "Rundruf-Mails und -Pushes blieben am 19.8. vormittags kurz hängen (eine Deploy-Einstellung sperrte den Versand-Takt aus), behoben und alles nachträglich zugestellt; Mails kommen neu vom Absender Beedaro Info", melder: "Denis" },
      { typ: "fix", bereich: "Admin", text: "Banner- und Laufschrift-Editor im Katalog-Stil der Seite: Mono-Beschriftungen, eckige Wahl-Knöpfe, Marken-Farbkacheln plus echte Farbwähler-Boxen mit Hex-Anzeige, gelber Speichern-Knopf", melder: "Denis" },
      { typ: "fix", bereich: "Startseite", text: "Kaputtes ü unter 'Zuletzt angesehen' repariert (Zeichensalat 'kÃ¼rzlich' durch einen Kodierungsfehler in der Datei), ganze Codebasis auf weitere Fälle geprüft: sauber", melder: "Denis" },
      { typ: "neu", bereich: "Mieten", text: "Laufende Mieten haben jetzt einen tickenden Live-Countdown auf der Bestellseite (Tage/Std/Min/Sek als Anzeigetafel) mit Fortschrittsbalken: grün läuft, gelb Endspurt, rot überfällig; der letzte Miettag zählt neu voll bis 23:59 (vorher endete die Rechnung schon am Vortag)", melder: "Denis" },
      { typ: "fix", bereich: "Mieten", text: "Der Fortschrittsbalken der Mietzeit läuft ab der Übergabe des Artikels, nicht erst ab dem gebuchten Startdatum: wer das Teil früher erhält, sieht den Balken sofort wachsen", melder: "Denis" },
      { typ: "fix", bereich: "Mieten", text: "Der 'Vermietung abgeschlossen'-Dialog mit Nektar-Belohnung sprang mitten in der laufenden Mietzeit auf (und teils mehrfach): er kommt jetzt erst beim echten Abschluss und die Einmal-Sperre greift sofort", melder: "Denis" },
      { typ: "fix", bereich: "Mieten", text: "Der Miet-Abschluss war benachrichtigungslos: jetzt melden alle fünf Schritte (Rückgabe markiert, Rückgabe bestätigt, Schaden gemeldet, Schaden akzeptiert, Kaution zurückerstattet) per Glocke, Mail und Push, mit Beträgen im Text", melder: "Denis" },
      { typ: "neu", bereich: "Mieten", text: "Der Mieter sieht die Kautionsabrechnung jetzt selbst: nach der Rückgabe die gleiche Aufstellung wie der Vermieter (Kaution, Schadenabzug, Rückerstattung) samt Kautions-Rechnung als Beleg, auch nach Abschluss noch abrufbar", melder: "Denis" },
      { typ: "fix", bereich: "Mieten", text: "Buchungen-Seite auf dem Handy aufgeräumt: Titel, Daten und Preis quetschten sich in eine Zeile, jetzt Karten-Layout mit voller Breite für Bild und Titel, Preis und Status darunter, Knöpfe (Bestätigen/Absagen/Zur Bestellung) als volle Zeile", melder: "Denis" },
      { typ: "fix", bereich: "Mieten", text: "Verwechslungsgefahr am Countdown behoben: unter dem Balken stand die Restzeit in Tagen (z.B. 12), was wie die Mietdauer aussah (11 in Buchungen und Rechnung); dort steht jetzt die gebuchte Mietdauer, die Restzeit steht ja auf der Anzeigetafel", melder: "Denis" },
      { typ: "fix", bereich: "Startseite", text: "Neues Sommer-Saison-Bild: warmes Flohmarkt-Foto im Abendlicht statt der sterilen Studio-Anordnung auf Knallblau, passt jetzt zum Katalog-Look der Seite", melder: "Denis" },
      { typ: "fix", bereich: "Auktion", text: "Das Gebotsfeld hat jetzt echte Plus/Minus-Knöpfe, die um den Gebotsschritt erhöhen: die kleinen Pfeile im Zahlenfeld gab es nur am Desktop, auf dem Handy fehlten sie ganz", melder: "Denis" },
      { typ: "fix", bereich: "Startseite", text: "Hero auf dem Handy entkastet: Die Exponat-Karte füllte fast den ganzen Bildschirm als weisser Block, jetzt bleibt sie oben, ist aber ein kompakter, schräg aufgeklebter Sticker mit Luft drumherum, und Überschrift plus Knöpfe passen mit auf den ersten Blick", melder: "Denis" },
      { typ: "fix", bereich: "Kaufen", text: "Preisvorschläge haben jetzt echte Grenzen: 70% bis 99% des Inseratpreises, für Vorschlag UND Gegenvorschlag, serverseitig erzwungen. Vorher gingen 4.90 wie auch 60 bei einem 50-Franken-Artikel durch; der erlaubte Bereich steht jetzt direkt im Dialog", melder: "Denis" },
      { typ: "neu", bereich: "Konto", text: "Nutzer blockieren: im Chat übers Sperr-Symbol, verwalten unter Einstellungen → Blockierte Nutzer. Gesperrte können dir nicht mehr schreiben, keine Vorschläge machen, nicht auf deine Auktionen bieten und nichts von dir kaufen (alles serverseitig durchgesetzt)", melder: "Denis" },
      { typ: "neu", bereich: "Inserieren", text: "Hinweis-Feld für die KI: stichwortartig ergänzen, was man auf Fotos nicht sieht (z.B. 'Aktenschrank aus MDF'), die KI übernimmt Material, Marke, Modell und Funktionszustand in Titel und Beschreibung; vorher wurde etwa MDF als Metall erkannt", melder: "Denis" },
      { typ: "fix", bereich: "Design", text: "Die Easter-Egg-Biene poppte nach Spruch und Abflug kurz an ihrer letzten Position auf, behoben; ausserdem erscheint sie nur noch bei aktivem Tab und verschwindet still, wenn man während ihres Flugs den Tab wechselt", melder: "Denis" },
      { typ: "fix", bereich: "Inserieren", text: "Freigabe-Schlupfloch geschlossen: Ein noch nicht freigegebenes Inserat konnte über Bearbeiten + Veröffentlichen an der Prüfung vorbei live gehen, jetzt landet es zurück in der Freigabe-Schlange; dazu klappt die Freigabe nun auch für Mitarbeiter-Rollen", melder: "Denis" },
      { typ: "fix", bereich: "Inserat", text: "Eigenschaften wie Grösse, Farbe und Material erscheinen jetzt auf der Inserat-Seite (eigener Block unter der Beschreibung); vorher wurden sie zwar gespeichert, aber nirgends angezeigt. Ein Speicherfehler, der Werte doppelt in fremde Kategorien schrieb, ist behoben und bereinigt", melder: "Denis" },
      { typ: "neu", bereich: "Inserieren", text: "Lieferfrist wählbar: 'Versandbereit innert' 1-2 Tagen, 3-5 Tagen, 1 oder 2 Wochen (z.B. für Neuware auf Bestellung oder Ferien). Käufer sehen die Frist auf dem Inserat und im Kauf-Dialog, bei längeren Fristen auch auf der Bestellseite", melder: "Denis" },
      { typ: "neu", bereich: "Konto", text: "Shop-Banner für Unternehmenskonten: eigenes Banner (empfohlen 1600×400) in den Einstellungen hochladen, es erscheint gross über dem öffentlichen Profil. Nur für Konten vom Typ Unternehmen", melder: "Denis" },
      { typ: "neu", bereich: "Inserieren", text: "Neuware mit Varianten und Stückzahl: Bei Zustand Neu (Festpreis) entscheidet ein Umschalter pro Eigenschaft zwischen festem Wert und 'Käufer wählt' (Chips, z.B. Grössen S/M/L), dazu eine Stückzahl. Käufer wählen beim Kauf ihre Variante, jeder Kauf zieht 1 Stück ab, verkauft erst wenn alles weg ist; die Wahl steht auf Bestellung und Rechnung, das Inserat zeigt die wählbaren Werte und den Restbestand", melder: "Denis" },
      { typ: "fix", bereich: "Admin", text: "Geplante Inserate liessen sich nicht freigeben (die Datenbank lehnte den neuen Status ab), behoben; dazu eigener Geplant-Tab im Admin und die Startzeit steht jetzt auch in der Handy-Ansicht von Meine Inserate", melder: "Denis" },
      { typ: "fix", bereich: "Mails & Push", text: "Bewertungen, neue Nachrichten und Fragen zum Inserat lösten weder Mail noch Push aus (nur die Glocke), jetzt greifen die Schalter in den Einstellungen", melder: "Denis" },
    ],
  },
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
