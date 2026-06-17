"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Search, User, ShoppingBag, Tag, Heart, Star, CreditCard,
  Shield, HelpCircle, ChevronDown, ChevronRight, Package,
  Gavel, Home, Gift, MapPin, FileText, Mail, Phone,
  Lock, AlertTriangle, BookOpen, ArrowRight,
} from "lucide-react";
import { colors, fonts, radius } from "@/lib/theme";
import BeeIcon from "@/components/shared/BeeIcon";

// ── Katalog-Design-Tokens ──
const INK = "#14110D";
const SAND = "#ECE3D2";
const PAPER = "#FBF8F2";
const PETROL = "#0B5E5C";
const MONO = "'Space Mono', ui-monospace, monospace";
const HEAD = "'General Sans', 'Manrope', system-ui, sans-serif";

// ─── Help Categories ──────────────────────────────────────────
const CATEGORIES = [
  {
    id: "account",
    icon: User,
    title: "Mein Konto",
    desc: "Registrierung, Login, Profil & Verifizierung",
    color: "#5B8C5A",
    faqs: [
      { q: "Wie registriere ich mich auf BEEDARO?", a: "Klicke oben rechts auf «Registrieren» und erstelle dein Konto mit E-Mail-Adresse und Passwort. Du erhältst eine Bestätigungsmail." },
      { q: "Wie verifiziere ich mein Konto?", a: "Unter Einstellungen → Verifizierung kannst du E-Mail, Telefonnummer, Postadresse und ID verifizieren. Je mehr du verifizierst, desto höher dein Trust Level." },
      { q: "Wie ändere ich mein Passwort?", a: "Klicke auf der Login-Seite auf «Passwort vergessen» und folge den Anweisungen in der E-Mail." },
      { q: "Was ist das Trust Level?", a: "Dein Trust Level zeigt anderen Nutzern, wie vertrauenswürdig du bist. Es steigt mit jeder Verifizierung: Starter → Basis → Vertraut → Vollständig." },
      { q: "Wie lade ich ein Profilbild hoch?", a: "Unter Einstellungen → Profil kannst du deinen Anzeigenamen und dein «Über mich» anpassen. Profilbilder werden automatisch aus deinen Initialen generiert." },
    ],
  },
  {
    id: "buy",
    icon: ShoppingBag,
    title: "Kaufen",
    desc: "Suchen, bieten, kaufen & bezahlen",
    color: "#94B9C9",
    faqs: [
      { q: "Wie kaufe ich einen Artikel?", a: "Finde einen Artikel über die Suche oder Kategorien. Bei Festpreis-Inseraten klickst du auf «Sofort kaufen». Bei Auktionen gibst du ein Gebot ab." },
      { q: "Wie bezahle ich?", a: "Nach dem Kauf erhältst du eine QR-Rechnung mit den Zahlungsinformationen des Verkäufers. Du überweist den Betrag per Banküberweisung oder TWINT." },
      { q: "Kann ich einen Preisvorschlag machen?", a: "Wenn der Verkäufer «Preis verhandelbar» aktiviert hat, kannst du einen Preisvorschlag zwischen 70% und 99% des Preises senden." },
      { q: "Was ist der Käuferschutz?", a: "BEEDARO bietet einen Bewertungs-System. Prüfe immer das Trust Level und die Bewertungen des Verkäufers bevor du kaufst." },
      { q: "Wie funktioniert die Abholung?", a: "Bei Abholung vereinbarst du mit dem Verkäufer einen Termin. Die Adresse wird dir nach dem Kauf angezeigt. Bezahlung erfolgt bar bei Übergabe." },
    ],
  },
  {
    id: "sell",
    icon: Tag,
    title: "Verkaufen",
    desc: "Inserate erstellen, Versand & Gebühren",
    color: "#F4C03F",
    faqs: [
      { q: "Wie erstelle ich ein Inserat?", a: "Klicke auf «+ Inserieren» und fülle das Formular aus: Fotos, Titel, Beschreibung, Kategorie, Preis, Zustand und Versandoptionen. Du wählst zwischen Festpreis, Auktion, Miete, Service und Gratis. Jedes Inserat wird vor Veröffentlichung kurz geprüft." },
      { q: "Was kostet es, ein Inserat zu erstellen?", a: "Das Erstellen eines Inserats ist kostenlos. Erst bei einem erfolgreichen Verkauf fällt die Bee-Rate Gebühr an (3-10%, je nach gewählter Stufe)." },
      { q: "Was ist die Bee-Rate?", a: "Die Bee-Rate ist deine selbst gewählte Gebühr (Fair 3%, Supporter 5%, Impact 7% oder Bee Hero 10%). Sie wird nur bei erfolgreichem Verkauf vom Erlös abgezogen. 20% davon fliessen als Bee-Impact in Schweizer Naturschutzprojekte." },
      { q: "Wie funktioniert der Versand?", a: "Beim Inserieren wählst du Paket, Brief, Sperrgut oder andere Versandarten. Die Versandkosten basieren auf den aktuellen Post-Tarifen. Du kannst maximal CHF 5 über den Post-Tarif aufschlagen." },
      { q: "Kann ich mein Inserat bearbeiten?", a: "Ja, unter «Meine Inserate» kannst du deine Inserate jederzeit bearbeiten, pausieren oder löschen, solange keine aktiven Gebote oder Buchungen bestehen." },
    ],
  },
  {
    id: "rent",
    icon: Home,
    title: "Miete, Service & Gratis",
    desc: "Vermieten, Dienstleistungen anbieten oder gratis abgeben",
    color: "#8B6DB0",
    faqs: [
      { q: "Wie vermiete ich einen Artikel?", a: "Beim Inserieren wählst du «Miete» als Inserattyp. Setze den Mietpreis pro Stunde, Tag, Woche oder Monat und optional eine Kaution." },
      { q: "Wie buche ich einen Mietartikel?", a: "Wähle deinen gewünschten Zeitraum und klicke auf «Buchen». Du erhältst die Kontaktdaten des Vermieters." },
      { q: "Wie biete ich eine Dienstleistung an?", a: "Wähle «Service» als Inserattyp und lege deinen Preis pro Stunde, Tag, Woche oder Monat fest. Kunden fragen einen Termin an, abgerechnet wird nach Abschluss über eine Service-Rechnung." },
      { q: "Wie verschenke ich etwas?", a: "Beim Inserieren wählst du «Gratis». Der Artikel wird kostenlos angeboten. Nur Abholung, keine Gebühren." },
    ],
  },
  {
    id: "beeimpact",
    icon: Heart,
    title: "Bee-Impact",
    desc: "Dein Beitrag für Schweizer Naturschutz",
    color: "#5B8C5A",
    faqs: [
      { q: "Was ist der Bee-Impact?", a: "20% deiner Bee-Rate Gebühr fliessen direkt in Schweizer Naturschutzprojekte. So trägst du mit jedem Kauf und Verkauf zum Schutz der Umwelt bei." },
      { q: "Was ist das Bee-Level?", a: "Dein Bee-Level steigt mit deinem gesammelten Bee-Impact: Bee Starter → Busy Bee → Hive Builder → Queen Bee → Bee Legend. Höhere Level bringen Plattform-Vorteile." },
      { q: "Wo sehe ich den Gesamtbeitrag?", a: "Auf der Startseite zeigt der Counter den Gesamtbeitrag der BEEDARO Community in Echtzeit." },
    ],
  },
  {
    id: "ratings",
    icon: Star,
    title: "Bewertungen",
    desc: "Bewertungen abgeben & verstehen",
    color: "#F4A100",
    faqs: [
      { q: "Wie bewerte ich einen Kauf?", a: "Nach Abschluss einer Bestellung (Empfang bestätigt) kannst du den Verkäufer mit 1-5 Sternen bewerten und einen Kommentar hinterlassen." },
      { q: "Kann ich eine Bewertung ändern?", a: "Bewertungen können nach dem Absenden nicht mehr geändert werden. Kontaktiere den Support bei Problemen." },
      { q: "Warum sind Bewertungen wichtig?", a: "Bewertungen helfen anderen Nutzern, vertrauenswürdige Verkäufer zu erkennen. Deine Durchschnittsbewertung wird auf deinem Profil angezeigt." },
    ],
  },
  {
    id: "fees",
    icon: CreditCard,
    title: "Gebühren & Zahlung",
    desc: "Bee-Rate, Rechnungen, IBAN & Auszahlung",
    color: "#94B9C9",
    faqs: [
      { q: "Welche Gebühren fallen an?", a: "Inserieren ist kostenlos. Bei erfolgreichem Verkauf fällt die Bee-Rate an (3-10%, selbst gewählt). 20% davon gehen in den Bee-Impact." },
      { q: "Wie erhalte ich meine Gebührenrechnung?", a: "Unter «Gebühren» findest du alle offenen und bezahlten Gebühren. Monatlich wird eine Sammelrechnung erstellt mit QR-Zahlschein." },
      { q: "Wo hinterlege ich meine IBAN?", a: "Unter Einstellungen → Zahlung. Deine IBAN wird Käufern nach einem bestätigten Kauf angezeigt, damit sie per Überweisung bezahlen können." },
      { q: "Was passiert bei unbezahlten Gebühren?", a: "Nach 30 Tagen erhältst du eine Erinnerung, nach 45 Tagen eine Mahnung. Nach 60 Tagen werden deine Inserate pausiert bis die Zahlung eingeht." },
    ],
  },
  {
    id: "security",
    icon: Shield,
    title: "Sicherheit",
    desc: "Betrug vermeiden, Melden & Datenschutz",
    color: "#c62828",
    faqs: [
      { q: "Wie erkenne ich Betrug?", a: "Achte auf: unrealistisch tiefe Preise, Druck zur schnellen Zahlung, Kommunikation ausserhalb der Plattform, und fehlende Verifizierung. Nutze immer das BEEDARO Nachrichtensystem." },
      { q: "Wie melde ich ein verdächtiges Inserat?", a: "Klicke auf der Inserat-Seite auf «Melden» und wähle den Grund (Gefälscht, Unangemessen, Betrug, Spam). Unser Team prüft die Meldung." },
      { q: "Sind meine Daten sicher?", a: "Ja. Persönliche Daten werden verschlüsselt gespeichert und nie an Dritte weitergegeben. ID-Dokumente werden in einem privaten Storage gespeichert." },
      { q: "BEEDARO wird dich nie auffordern, sensible Daten preiszugeben", a: "Gib niemals Passwörter, Kreditkartendaten oder TWINT-Logindaten weiter. Offizielle E-Mails kommen nur von @beedaro.ch." },
    ],
  },
  {
    id: "contact",
    icon: Mail,
    title: "Kontakt & Rechtliches",
    desc: "Support, AGB, Datenschutz & Impressum",
    color: "#666",
    faqs: [
      { q: "Wie erreiche ich den Support?", a: "Schreibe uns an support@beedaro.ch. Wir antworten in der Regel innerhalb von 24 Stunden." },
      { q: "Wo finde ich die AGB?", a: "Unsere Allgemeinen Geschäftsbedingungen findest du unter /terms." },
      { q: "Wo finde ich die Datenschutzerklärung?", a: "Unsere Datenschutzerklärung findest du unter /privacy." },
      { q: "Wer betreibt BEEDARO?", a: "BEEDARO wird betrieben von Denis Mihaljevic, Gemeindehausstrasse 11B, 6010 Kriens, Schweiz. Mehr Infos unter /imprint." },
    ],
  },
];

// ─── FAQ Item Component ─────────────────────────────────────
function FaqItem({ q, a, open, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "14px 16px", cursor: "pointer",
        borderBottom: `1px solid ${colors.borderLt}`,
        transition: "background .15s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "#fafaf8"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: colors.dark, flex: 1, paddingRight: 12 }}>{q}</span>
        <ChevronDown size={16} color={colors.muted} style={{
          transition: "transform .2s", transform: open ? "rotate(180deg)" : "rotate(0)",
          flexShrink: 0,
        }} />
      </div>
      {open && (
        <p style={{ margin: "10px 0 0", fontSize: 13, color: colors.muted, lineHeight: 1.6 }}>{a}</p>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────
export default function HelpPage() {
  const [search, setSearch] = useState("");
  const [openCat, setOpenCat] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  // Filter categories & FAQs by search
  const q = search.toLowerCase().trim();
  const filtered = q.length < 2 ? CATEGORIES : CATEGORIES.map(cat => ({
    ...cat,
    faqs: cat.faqs.filter(f => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)),
  })).filter(cat => cat.faqs.length > 0 || cat.title.toLowerCase().includes(q) || cat.desc.toLowerCase().includes(q));

  return (
    <div style={{ fontFamily: fonts.body, background: PAPER, minHeight: "100vh", color: INK }}>

      {/* ── Hero ── */}
      <div style={{
        background: SAND, padding: "60px 20px 56px", textAlign: "center",
        borderBottom: `1px solid ${INK}`,
        backgroundImage: `radial-gradient(${INK}0F 1px, transparent 1px)`, backgroundSize: "22px 22px",
      }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: PETROL, marginBottom: 12 }}>Hilfe-Katalog</div>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, fontFamily: HEAD, color: INK, margin: "0 0 8px", letterSpacing: "-0.02em", lineHeight: 1.05 }}>
            Wie können wir helfen?
          </h1>
          <p style={{ fontSize: 15, color: "rgba(20,17,13,0.6)", margin: "0 0 24px" }}>
            Finde Antworten zu Konto, Kaufen, Verkaufen, Gebühren und mehr.
          </p>

          {/* Search */}
          <div style={{ position: "relative", maxWidth: 480, margin: "0 auto" }}>
            <Search size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: INK }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setOpenCat(null); setOpenFaq(null); }}
              placeholder="Suchbegriff eingeben..."
              style={{
                width: "100%", padding: "13px 16px 13px 42px", borderRadius: 8,
                border: `1.5px solid ${INK}`, background: "#fff",
                fontSize: 15, fontFamily: fonts.body, color: INK, outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px 80px" }}>

        {/* Search Results */}
        {q.length >= 2 ? (
          <>
            <p style={{ fontSize: 13, color: colors.muted, marginBottom: 20 }}>
              {filtered.reduce((n, c) => n + c.faqs.length, 0)} Ergebnisse für «{search}»
            </p>
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <HelpCircle size={40} color={colors.muted} style={{ marginBottom: 12 }} />
                <p style={{ fontSize: 15, color: colors.muted }}>Keine Ergebnisse gefunden.</p>
                <p style={{ fontSize: 13, color: colors.muted }}>Schreibe uns an <a href="mailto:support@beedaro.ch" style={{ color: PETROL, fontWeight: 700 }}>support@beedaro.ch</a></p>
              </div>
            )}
            {filtered.map(cat => (
              <div key={cat.id} style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.dark, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
                  <cat.icon size={16} color={cat.color} /> {cat.title}
                </h3>
                <div style={{ borderRadius: 10, border: `1px solid ${INK}`, overflow: "hidden", background: "#fff" }}>
                  {cat.faqs.map((f, i) => (
                    <FaqItem key={i} q={f.q} a={f.a} open={openFaq === `${cat.id}-${i}`}
                      onClick={() => setOpenFaq(openFaq === `${cat.id}-${i}` ? null : `${cat.id}-${i}`)} />
                  ))}
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            {/* Category Grid */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 16, marginBottom: 32,
            }}>
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isOpen = openCat === cat.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => { setOpenCat(isOpen ? null : cat.id); setOpenFaq(null); }}
                    style={{
                      padding: "20px", borderRadius: 12, cursor: "pointer",
                      background: "#fff", border: `1px solid ${INK}`,
                      boxShadow: isOpen ? `0 10px 24px rgba(20,17,13,.12)` : "none",
                      transition: "all .2s",
                    }}
                    onMouseEnter={e => { if (!isOpen) e.currentTarget.style.boxShadow = "0 8px 20px rgba(20,17,13,.1)"; }}
                    onMouseLeave={e => { if (!isOpen) e.currentTarget.style.boxShadow = "none"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, display: "flex",
                        alignItems: "center", justifyContent: "center",
                        background: SAND, border: `1px solid ${INK}`,
                      }}>
                        <Icon size={20} color={cat.color} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: colors.dark }}>{cat.title}</div>
                        <div style={{ fontSize: 12, color: colors.muted, marginTop: 1 }}>{cat.desc}</div>
                      </div>
                      <ChevronRight size={16} color={colors.muted} style={{
                        transition: "transform .2s",
                        transform: isOpen ? "rotate(90deg)" : "rotate(0)",
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Expanded Category FAQs */}
            {openCat && (() => {
              const cat = CATEGORIES.find(c => c.id === openCat);
              if (!cat) return null;
              return (
                <div style={{ marginBottom: 32 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <cat.icon size={20} color={cat.color} />
                    <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: colors.dark }}>{cat.title}</h2>
                    <span style={{ fontSize: 12, color: colors.muted }}>· {cat.faqs.length} Artikel</span>
                  </div>
                  <div style={{ borderRadius: 12, border: `1px solid ${INK}`, overflow: "hidden", background: "#fff" }}>
                    {cat.faqs.map((f, i) => (
                      <FaqItem key={i} q={f.q} a={f.a} open={openFaq === `${cat.id}-${i}`}
                        onClick={() => setOpenFaq(openFaq === `${cat.id}-${i}` ? null : `${cat.id}-${i}`)} />
                    ))}
                  </div>
                </div>
              );
            })()}
          </>
        )}

        {/* ── Contact Box ── */}
        <div style={{
          padding: 28, borderRadius: 12, background: "#fff",
          border: `1px solid ${INK}`, textAlign: "center",
        }}>
          <Mail size={26} color={PETROL} style={{ marginBottom: 8 }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: HEAD, color: INK, margin: "0 0 6px" }}>Nicht gefunden, was du suchst?</h3>
          <p style={{ fontSize: 13.5, color: "rgba(20,17,13,0.6)", margin: "0 0 18px" }}>
            Unser Team hilft dir gerne weiter.
          </p>
          <a href="mailto:support@beedaro.ch" className="bd-btn" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "12px 26px", borderRadius: 10, background: INK,
            color: PAPER, fontSize: 14, fontWeight: 700, textDecoration: "none",
            fontFamily: fonts.body, border: `1.5px solid ${INK}`,
          }}>
            <Mail size={16} /> support@beedaro.ch
          </a>
        </div>
      </div>
    </div>
  );
}
