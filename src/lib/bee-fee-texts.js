// ═══════════════════════════════════════════════════════════════
// BEE-FEE EMOTIONALE TEXTE — 25 pro Stufe, rotierend
// Default: impact (7%)
// ═══════════════════════════════════════════════════════════════

export const BEE_FEE_TEXTS = {
  fair: [
    // 3% — bewusst schwach/minimal, soll zum Upgraden motivieren
    "Ein Blümchen am Wegrand",
    "Ein einzelner Samen im Wind",
    "Ein Tropfen in einem leeren Teich",
    "Ein Grashalm auf einer kahlen Wiese",
    "Eine Blüte zwischen Beton",
    "Ein Sonnenstrahl durch die Wolken",
    "Ein Schmetterling findet eine Blume",
    "Ein Marienkäfer hat ein Blatt",
    "Eine Pfütze für einen durstigen Vogel",
    "Ein einziger Löwenzahn blüht",
    "Ein Regentropfen auf trockener Erde",
    "Ein Gänseblümchen überlebt den Rasenmäher",
    "Ein kleiner Stein im grossen Fluss",
    "Ein Funke, noch kein Feuer",
    "Ein Blatt fällt in gute Erde",
    "Ein Sandkorn baut noch keine Insel",
    "Ein Windstoss trägt einen Samen weiter",
    "Eine Ameise findet den Weg nach Hause",
    "Ein Tautropfen auf einem Spinnennetz",
    "Ein Moosfetzen auf nacktem Fels",
    "Eine Knospe, noch geschlossen",
    "Ein erster Schritt auf langem Weg",
    "Ein Funke Hoffnung in der Nacht",
    "Ein leises Summen in der Ferne",
    "Ein Blümchen. Immerhin",
  ],
  supporter: [
    // 5% — respektabel, etwas Konkretes
    "Nistplätze für bedrohte Wildbienen",
    "Eine Wildblumenwiese erwacht",
    "Drei Hummeln finden ein Zuhause",
    "Saatgut für bienenfreundliche Gärten",
    "Ein Sandnistplatz für Erdbienen",
    "Blühstreifen zwischen den Feldern",
    "Eine Hecke voller Leben",
    "Nektar für hungrige Bestäuber",
    "Ein sicherer Nistplatz im Totholz",
    "Eine Trockenmauer für Mauerbienen",
    "Fünf Quadratmeter Wildblumen blühen",
    "Pollen für die nächste Generation",
    "Ein Stück Brachland wird zur Oase",
    "Ein Obstbaum wird zum Bienenparadies",
    "Wildbienensand für drei neue Nester",
    "Klee und Salbei statt Rasen",
    "Eine vergessene Ecke blüht auf",
    "Mohnblumen am Ackerrand",
    "Ein Garten wird bienenfreundlich",
    "Heimische Pflanzen statt Ziergras",
    "Ein Balkon voller Wildblumen",
    "Lavendel und Thymian für Bestäuber",
    "Ein Stück Natur kehrt zurück",
    "Schutz für bodenbrütende Arten",
    "Nahrung für die Bestäuber von morgen",
  ],
  impact: [
    // 7% — DEFAULT — emotional stark, konkret, persönlich
    "1'000 Bienen finden ein Zuhause",
    "Eine ganze Kolonie überlebt dank dir",
    "500 m² Blühfläche entstehen",
    "Ein Bienenvolk hat wieder Nahrung",
    "Du gibst einer Kolonie eine Zukunft",
    "Wildblumenwiesen so weit das Auge reicht",
    "Eine Baumhöhle wird zum Bienenstock",
    "Dank dir blüht eine ganze Wiese",
    "Ein bedrohtes Volk wird gerettet",
    "Leben entsteht, das ohne dich nicht da wäre",
    "Eine Imkerin bekommt Unterstützung",
    "Hunderte Nistplätze werden geschaffen",
    "Ein ganzer Obstgarten wird bestäubt",
    "Schweizer Wildbienen bekommen Schutz",
    "Drei neue Baumhöhlen im Wald",
    "Ein Bienenforschungsprojekt geht weiter",
    "Kartierung wilder Honigbienenvölker",
    "Rettung einer bedrohten Wildbienenart",
    "Ein Schulprojekt bringt Kindern Bienen näher",
    "Landwirte legen Blühstreifen an",
    "Ein ganzer Lebensraum wird geschützt",
    "Monitoring von 370 wilden Bienenvölkern",
    "Zeidlerei: ein altes Handwerk lebt weiter",
    "Ein Naturschutzgebiet wird erweitert",
    "Du finanzierst echten Bienenschutz in der Schweiz",
  ],
  hero: [
    // 10% — Maximum Impact, legendär, Gänsehaut
    "Ein ganzes Tal blüht wieder",
    "Du rettest ein Ökosystem",
    "Landschaften verwandeln sich. Deinetwegen",
    "Ein Wald wird zum Bienenparadies",
    "Ganze Regionen profitieren von deinem Beitrag",
    "Du finanzierst die Rückkehr der Wildbienen",
    "Ein Flussufer wird zum Blütenmeer",
    "Vom Aussterben bedrohte Arten überleben",
    "Ein Alpental wird zum Schutzgebiet",
    "Du veränderst Landschaften. Nicht irgendwann, jetzt",
    "Hunderte Hektar werden bienenfreundlich",
    "Die Schweizer Wildbienenforschung lebt weiter",
    "Ein ganzer Kanton profitiert",
    "Bauern, Bienen und Natur im Gleichgewicht",
    "Eine Generation von Bienen ist dir zu verdanken",
    "Du ermöglichst wissenschaftliche Durchbrüche",
    "Naturschutzprojekte werden Realität",
    "Bedrohte Lebensräume werden wiederhergestellt",
    "Kinder lernen Bienenschutz. Dank dir",
    "Ein Netzwerk aus Blühflächen entsteht",
    "Die Biodiversität der Schweiz wird gestärkt",
    "Wilde Honigbienenvölker kehren in die Wälder zurück",
    "Du machst den Unterschied zwischen Überleben und Aussterben",
    "Maximum Impact. Du bist der Grund, warum Landschaften blühen.",
    "Dein Beitrag verändert die Schweiz. Quadratmeter für Quadratmeter",
  ],
};

// Zufälligen Text für eine Stufe holen
export function getRandomBeeText(tier) {
  const texts = BEE_FEE_TEXTS[tier];
  if (!texts || texts.length === 0) return "";
  return texts[Math.floor(Math.random() * texts.length)];
}

// Alle 4 Texte auf einmal (für die Auswahl-UI)
export function getRandomBeeTexts() {
  return {
    fair: getRandomBeeText("fair"),
    supporter: getRandomBeeText("supporter"),
    impact: getRandomBeeText("impact"),
    hero: getRandomBeeText("hero"),
  };
}

// Untertitel pro Stufe (statisch)
export const BEE_FEE_SUBTITLES = {
  fair: "Ein kleiner Anfang. Immerhin.",
  supporter: "Du schaffst Lebensraum, wo vorher keiner war.",
  impact: "Leben, das ohne dich nicht existieren würde.",
  hero: "Du veränderst die Schweiz. Nicht irgendwann, jetzt.",
};

// Partner-Organisationen (für spätere Anzeige)
export const BEE_PARTNERS = [
  { name: "FreeTheBees", url: "https://freethebees.ch", focus: "Wilde Honigbienen, Zeidlerei, BeeMapping" },
  { name: "BienenSchweiz", url: "https://bienen.ch", focus: "Blühflächen, Imkerförderung" },
  { name: "WildBee.ch", url: "https://wildbee.ch", focus: "Wildbienen, natürliche Nistplätze" },
  { name: "NimS", url: "https://natur-im-siedlungsraum.ch", focus: "Wildbienen in Städten" },
  { name: "ProSpecieRara", url: "https://prospecierara.ch", focus: "Genetische Vielfalt, Artenschutz" },
];
