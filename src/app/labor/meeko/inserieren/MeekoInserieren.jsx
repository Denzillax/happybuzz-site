"use client";
// Inserieren im Meeko-Stil (Denis 20.09.2026): Test, ob der Stil auch ein langes Formular trägt. Das ist eine Attrappe:
// Hier wird nichts gespeichert und nichts hochgeladen, die Fotos bleiben im Browser. Das echte Formular
// (components/listings/ListingForm.jsx) bleibt unberührt und kann mehr: KI-Titel und KI-Text, Import, Eigenschaften je
// Kategorie, Posttarife, Lieferfrist, Adressen, Stückzahl, später veröffentlichen.
// Aufbau: links die Abschnitte als Karten, rechts klebt die Vorschau. Sie zeigt das Inserat so, wie es später in der
// Suche steht, auf der Tafel in der Farbe des gewählten Formats, darunter die Gebührenrechnung.
// Zahlen kommen aus lib/constants.js (FEE_TIERS, DEFAULT_FEE_TIER, FEE_FREE_BELOW, FEE_CAP, BEE_IMPACT_RATE), nichts ist hartkodiert.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Banknote, Camera, Check, Gavel, Gift, HandCoins, ImagePlus, Landmark, MapPin, Smartphone, Tag, Truck, Wrench, X } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { BEE_IMPACT_RATE, CONDITIONS, DEFAULT_FEE_TIER, FEE_CAP, FEE_FREE_BELOW, FEE_TIERS, RENT_PERIODS } from "@/lib/constants";
import { FORMAT, Fuss, Kopf, PASTELL, Roll, useEinblenden, useMeekoSchrift } from "../MeekoTeile";

const FORMATE = [
  { typ: "sell", icon: Tag, text: "Du nennst den Preis." },
  { typ: "auction", icon: Gavel, text: "Die Käufer bieten." },
  { typ: "rent", icon: HandCoins, text: "Verleihen statt verkaufen." },
  { typ: "free", icon: Gift, text: "Verschenken." },
  { typ: "service", icon: Wrench, text: "Deine Arbeit anbieten." },
];
const DAUER = [3, 5, 7, 10, 14];
const MAX_FOTOS = 8;
const chf = (n) => `CHF ${n.toLocaleString("de-CH", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
const rappen = (n) => `CHF ${n.toLocaleString("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Abschnitt({ nr, titel, hinweis, children }) {
  return (
    <section className="mk-f-karte mk-auf" aria-labelledby={`mk-f-${nr}`}>
      <header className="mk-f-kopf">
        <h2 id={`mk-f-${nr}`} className="mk-f-titel">{titel}</h2>
        {hinweis && <p className="mk-f-hinweis">{hinweis}</p>}
      </header>
      {children}
    </section>
  );
}

function Schalter({ icon: Icon, titel, text, an, onChange }) {
  return (
    <button type="button" className={`mk-f-schalter eckig kein-akzent${an ? " mk-f-schalter-an" : ""}`} role="switch" aria-checked={an} onClick={() => onChange(!an)}>
      <Icon size={22} strokeWidth={1.7} aria-hidden="true" />
      <span className="mk-f-schalter-text"><strong>{titel}</strong>{text && <span>{text}</span>}</span>
      <span className="mk-f-haken" aria-hidden="true">{an && <Check size={15} strokeWidth={3} />}</span>
    </button>
  );
}

export default function MeekoInserieren() {
  const [typ, setTyp] = useState("sell");
  const [fotos, setFotos] = useState([]); // { url, name }
  const [titel, setTitel] = useState("");
  const [zustand, setZustand] = useState("good");
  const [text, setText] = useState("");
  const [kat, setKat] = useState("");
  const [ort, setOrt] = useState("");
  const [kategorien, setKategorien] = useState([]);
  const [preis, setPreis] = useState("");
  const [verhandelbar, setVerhandelbar] = useState(false);
  const [sofort, setSofort] = useState("");
  const [dauer, setDauer] = useState("7");
  const [periode, setPeriode] = useState("day");
  const [depot, setDepot] = useState("");
  const [versand, setVersand] = useState(true);
  const [abholung, setAbholung] = useState(true);
  const [twint, setTwint] = useState(true);
  const [bar, setBar] = useState(true);
  const [bank, setBank] = useState(false);
  const [stufe, setStufe] = useState(DEFAULT_FEE_TIER);
  const [gemeldet, setGemeldet] = useState(false);
  const datei = useRef(null);
  const wurzel = useRef(null);
  const urls = useRef([]);
  useMeekoSchrift();
  useEinblenden(wurzel, []);

  useEffect(() => {
    supabase.from("categories").select("id, name, parent_id, sort_order").is("parent_id", null).neq("is_active", false).order("sort_order")
      .then(({ data }) => setKategorien(data || []));
    const liste = urls.current;
    return () => liste.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const dazu = (files) => {
    const neu = [...files].filter((f) => f.type.startsWith("image/")).slice(0, MAX_FOTOS - fotos.length).map((f) => {
      const url = URL.createObjectURL(f); urls.current.push(url); return { url, name: f.name };
    });
    if (neu.length) setFotos((alt) => [...alt, ...neu]);
  };
  const weg = (i) => setFotos((alt) => alt.filter((_, n) => n !== i));
  const alsCover = (i) => setFotos((alt) => [alt[i], ...alt.filter((_, n) => n !== i)]);

  const betrag = parseFloat(preis) || 0;
  const tier = FEE_TIERS.find((t) => t.tier === stufe) || FEE_TIERS[0];
  const rechnung = useMemo(() => {
    if (typ === "free" || betrag <= 0) return null;
    if (betrag < FEE_FREE_BELOW) return { frei: true };
    const gebuehr = Math.min((betrag * tier.pct) / 100, FEE_CAP);
    return { gebuehr, bienen: gebuehr * BEE_IMPACT_RATE, bleibt: betrag - gebuehr, deckel: gebuehr === FEE_CAP };
  }, [typ, betrag, tier]);

  const preisZeile = typ === "free" ? "Gratis" : betrag <= 0 ? "Preis fehlt noch"
    : typ === "auction" ? `ab ${chf(betrag)}` : typ === "rent" || typ === "service" ? `${chf(betrag)}/${RENT_PERIODS.find((p) => p.value === periode)?.short}` : chf(betrag);
  const preisLabel = { sell: "Preis", auction: "Startpreis", rent: "Mietpreis", service: "Preis" }[typ];
  // Was noch fehlt, in der Reihenfolge des Formulars. Steuert die Liste in der Vorschau, gesperrt wird nichts.
  const offen = [fotos.length === 0 && "ein Foto", titel.trim().length < 3 && "ein Titel", !kat && "eine Kategorie",
    typ !== "free" && betrag <= 0 && "ein Preis", typ !== "service" && !versand && !abholung && "Versand oder Abholung",
    typ !== "free" && !twint && !bar && !bank && "eine Zahlungsart"].filter(Boolean);

  return (
    <div className="mk" ref={wurzel}>
      <Kopf />

      <section className={`mk-f-hero mk-${PASTELL[typ]}`}>
        <h1 className="mk-s-h1">Dein Keller hat Inventar.<br />Wir haben Käufer.</h1>
        <p className="mk-f-hero-text">Format wählen, Fotos dazu, Preis setzen. Die Vorschau zeigt dir, wie das Inserat aussieht und was dir bleibt.</p>
      </section>

      <main className="mk-f-seite">
        <form className="mk-f-spalte" onSubmit={(e) => { e.preventDefault(); setGemeldet(true); }} noValidate>
          <Abschnitt nr="1" titel="Was bietest du an?" hinweis="Das Format bestimmt, welche Felder du unten siehst.">
            <div className="mk-f-formate" role="radiogroup" aria-label="Format">
              {FORMATE.map(({ typ: t, icon: Icon, text: beschrieb }) => (
                <button key={t} type="button" role="radio" aria-checked={typ === t} className={`mk-f-format mk-${PASTELL[t]} eckig kein-akzent${typ === t ? " mk-f-format-an" : ""}`} onClick={() => setTyp(t)}>
                  <Icon size={30} strokeWidth={1.4} aria-hidden="true" />
                  <strong>{FORMAT[t]}</strong>
                  <span>{beschrieb}</span>
                </button>
              ))}
            </div>
          </Abschnitt>

          <Abschnitt nr="2" titel="Fotos" hinweis={`Bis zu ${MAX_FOTOS} Bilder. Das erste ist das Titelbild. In dieser Vorschau bleiben sie auf deinem Gerät.`}>
            <input ref={datei} type="file" accept="image/*" multiple hidden onChange={(e) => { dazu(e.target.files); e.target.value = ""; }} />
            <div className="mk-f-fotos" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); dazu(e.dataTransfer.files); }}>
              {fotos.map((f, i) => (
                <div key={f.url} className={`mk-f-foto mk-${PASTELL[typ]}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.url} alt={`Foto ${i + 1}: ${f.name}`} />
                  {i === 0 ? <span className="mk-f-cover">Titelbild</span>
                    : <button type="button" className="mk-f-cover mk-f-cover-knopf eckig kein-akzent" onClick={() => alsCover(i)}>Als Titelbild</button>}
                  <button type="button" className="mk-f-foto-weg eckig kein-akzent" aria-label={`Foto ${i + 1} entfernen`} onClick={() => weg(i)}><X size={15} strokeWidth={2.6} /></button>
                </div>
              ))}
              {fotos.length < MAX_FOTOS && (
                <button type="button" className="mk-f-foto mk-f-foto-neu eckig kein-akzent" onClick={() => datei.current?.click()}>
                  {fotos.length === 0 ? <Camera size={30} strokeWidth={1.4} aria-hidden="true" /> : <ImagePlus size={26} strokeWidth={1.4} aria-hidden="true" />}
                  <span>{fotos.length === 0 ? "Fotos wählen oder hierher ziehen" : "Weiteres Foto"}</span>
                </button>
              )}
              {Array.from({ length: Math.max(0, Math.min(3, MAX_FOTOS - fotos.length - 1)) }).map((_, i) => <span key={i} className="mk-f-foto mk-f-foto-leer" aria-hidden="true" />)}
            </div>
          </Abschnitt>

          <Abschnitt nr="3" titel="Details" hinweis="Ein genauer Titel findet schneller einen Käufer als ein origineller.">
            <label className="mk-f-feld"><span>Titel</span>
              <input className="pille-input" type="text" maxLength={80} value={titel} onChange={(e) => setTitel(e.target.value)} placeholder="Marke, Modell, Grösse" />
              <small>{titel.length} von 80 Zeichen</small>
            </label>
            {typ !== "service" && (
              <div className="mk-f-feld"><span id="mk-f-zustand">Zustand</span>
                <div className="mk-f-pillen" role="radiogroup" aria-labelledby="mk-f-zustand">
                  {CONDITIONS.map((c) => (
                    <button key={c.value} type="button" role="radio" aria-checked={zustand === c.value} title={c.desc} className={`mk-s-pille mk-weiss eckig kein-akzent${zustand === c.value ? " mk-s-pille-an" : ""}`} onClick={() => setZustand(c.value)}>{c.label}</button>
                  ))}
                </div>
                <small>{CONDITIONS.find((c) => c.value === zustand)?.desc}</small>
              </div>
            )}
            <label className="mk-f-feld"><span>Beschreibung</span>
              <textarea className="pille-input" rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="Was ist dabei, was fehlt, warum gibst du es weg." />
            </label>
            <div className="mk-f-zwei">
              <label className="mk-f-feld"><span>Kategorie</span>
                <select value={kat} onChange={(e) => setKat(e.target.value)}><option value="">Kategorie wählen</option>{kategorien.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}</select>
              </label>
              <label className="mk-f-feld"><span>Ort</span>
                <input className="pille-input" type="text" value={ort} onChange={(e) => setOrt(e.target.value)} placeholder="PLZ oder Ort" />
              </label>
            </div>
          </Abschnitt>

          {typ !== "free" && (
            <Abschnitt nr="4" titel="Preis" hinweis={typ === "auction" ? "Tief starten bringt mehr Bieter. Der Sofortpreis ist freiwillig." : typ === "rent" ? "Preis pro Zeitraum, dazu ein Depot, wenn du willst." : null}>
              <div className="mk-f-zwei">
                <label className="mk-f-feld"><span>{preisLabel} in CHF</span>
                  <input className="pille-input mk-f-gross" type="number" min="0" step="0.05" inputMode="decimal" value={preis} onChange={(e) => setPreis(e.target.value)} placeholder="0" />
                </label>
                {typ === "auction" && (
                  <label className="mk-f-feld"><span>Sofortpreis in CHF, freiwillig</span>
                    <input className="pille-input mk-f-gross" type="number" min="0" step="0.05" inputMode="decimal" value={sofort} onChange={(e) => setSofort(e.target.value)} placeholder="0" />
                  </label>
                )}
                {(typ === "rent" || typ === "service") && (
                  <label className="mk-f-feld"><span>pro</span>
                    <select value={periode} onChange={(e) => setPeriode(e.target.value)}>{RENT_PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</select>
                  </label>
                )}
              </div>
              {typ === "auction" && (
                <div className="mk-f-feld"><span id="mk-f-dauer">Dauer</span>
                  <div className="mk-f-pillen" role="radiogroup" aria-labelledby="mk-f-dauer">
                    {DAUER.map((d) => <button key={d} type="button" role="radio" aria-checked={dauer === String(d)} className={`mk-s-pille mk-weiss eckig kein-akzent${dauer === String(d) ? " mk-s-pille-an" : ""}`} onClick={() => setDauer(String(d))}>{d} Tage</button>)}
                  </div>
                </div>
              )}
              {typ === "rent" && (
                <label className="mk-f-feld"><span>Depot in CHF, freiwillig</span>
                  <input className="pille-input" type="number" min="0" step="1" inputMode="decimal" value={depot} onChange={(e) => setDepot(e.target.value)} placeholder="0" />
                </label>
              )}
              {typ === "sell" && <Schalter icon={HandCoins} titel="Preis verhandelbar" text="Käufer dürfen dir ein Angebot machen." an={verhandelbar} onChange={setVerhandelbar} />}
            </Abschnitt>
          )}

          <Abschnitt nr="5" titel={typ === "free" ? "Übergabe" : "Übergabe und Zahlung"} hinweis="Versandkosten trägt der Käufer.">
            {typ !== "service" && (
              <div className="mk-f-zwei">
                <Schalter icon={Truck} titel="Versand" text="Per Post, Tarif wählst du im echten Formular." an={versand} onChange={setVersand} />
                <Schalter icon={MapPin} titel="Abholung" text="Der Käufer kommt vorbei." an={abholung} onChange={setAbholung} />
              </div>
            )}
            {typ !== "free" && (
              <div className="mk-f-drei">
                <Schalter icon={Smartphone} titel="TWINT" an={twint} onChange={setTwint} />
                <Schalter icon={Banknote} titel="Bar" an={bar} onChange={setBar} />
                <Schalter icon={Landmark} titel="Überweisung" an={bank} onChange={setBank} />
              </div>
            )}
          </Abschnitt>

          {typ !== "free" && (
            <Abschnitt nr="6" titel="Bee-Rate" hinweis={`Du wählst die Gebühr selbst. Sie fällt nur an, wenn du verkaufst. ${Math.round(BEE_IMPACT_RATE * 100)} % davon gehen an den Bienenschutz. Unter ${chf(FEE_FREE_BELOW)} ist der Verkauf gebührenfrei, mehr als ${chf(FEE_CAP)} kostet keiner.`}>
              <div className="mk-f-stufen" role="radiogroup" aria-label="Bee-Rate">
                {FEE_TIERS.map((t) => (
                  <button key={t.tier} type="button" role="radio" aria-checked={stufe === t.tier} className={`mk-f-stufe eckig kein-akzent${stufe === t.tier ? " mk-f-stufe-an" : ""}`} onClick={() => setStufe(t.tier)}>
                    <span className="mk-f-prozent">{t.pct}<small>%</small></span>
                    <strong>{t.label}</strong>
                    <span>{t.tier === DEFAULT_FEE_TIER ? "Standard" : t.desc}</span>
                  </button>
                ))}
              </div>
            </Abschnitt>
          )}

          <div className="mk-f-schluss">
            <button type="submit" className="mk-knopf mk-knopf-dunkel eckig kein-akzent"><Roll>Inserat veröffentlichen</Roll></button>
            <Link href="/listings/new" className="mk-knopf"><Roll>Zum echten Formular</Roll></Link>
            <p role="status" aria-live="polite">{gemeldet ? (offen.length ? `Es fehlt noch: ${offen.join(", ")}.` : "Alles da. Das hier ist die Vorschau, veröffentlicht wird nur im echten Formular.") : ""}</p>
          </div>
        </form>

        {/* Vorschau klebt rechts und zeigt das Inserat, wie es in der Suche steht */}
        <aside className="mk-f-vorschau" aria-label="Vorschau">
          <p className="mk-tags">So steht es in der Suche</p>
          <div className="mk-karte mk-f-probe">
            <span className={`mk-tafel mk-${PASTELL[typ]}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {fotos[0] ? <img src={fotos[0].url} alt="" /> : <span className="mk-f-ohne-bild"><Camera size={34} strokeWidth={1.2} aria-hidden="true" />Dein Titelbild</span>}
            </span>
            <span className="mk-karte-text">
              <span className="mk-tags">{FORMAT[typ]}{ort.trim() ? `, ${ort.trim()}` : ""}</span>
              <span className="mk-karte-titel">{titel.trim() || "Dein Titel"}</span>
              <span className="mk-karte-unten"><span className="mk-preis">{preisZeile}</span>{typ === "auction" && <span className="mk-rest">{dauer} Tage</span>}</span>
            </span>
          </div>

          {typ !== "free" && (
            <div className="mk-f-rechnung">
              <p className="mk-tags">Was dir bleibt</p>
              {!rechnung ? <p className="mk-f-leise">Setz einen Preis, dann rechnen wir.</p>
                : rechnung.frei ? <p className="mk-f-leise">Unter {chf(FEE_FREE_BELOW)} ist der Verkauf gebührenfrei. Dir bleiben {rappen(betrag)}.</p> : (
                  <dl>
                    <div><dt>{typ === "auction" ? "Beim Startpreis" : "Preis"}</dt><dd>{rappen(betrag)}</dd></div>
                    <div><dt>Bee-Rate {tier.pct} %{rechnung.deckel ? ", gedeckelt" : ""}</dt><dd>{`− ${rappen(rechnung.gebuehr)}`}</dd></div>
                    <div className="mk-f-bienen"><dt>davon Bienenschutz</dt><dd>{rappen(rechnung.bienen)}</dd></div>
                    <div className="mk-f-summe"><dt>Dir bleiben</dt><dd>{rappen(rechnung.bleibt)}</dd></div>
                  </dl>
                )}
              {typ === "auction" && rechnung && !rechnung.frei && <p className="mk-f-leise">Gerechnet wird am Schluss mit dem Zuschlag.</p>}
            </div>
          )}

          <div className="mk-f-offen">
            <p className="mk-tags">{offen.length ? "Fehlt noch" : "Bereit"}</p>
            {offen.length ? <ul>{offen.map((o) => <li key={o}>{o}</li>)}</ul> : <p className="mk-f-leise">Alle Pflichtangaben sind da.</p>}
          </div>
        </aside>
      </main>

      <Fuss hinweis="Vorschau des Formulars. Hier wird nichts gespeichert und nichts hochgeladen." />
    </div>
  );
}
