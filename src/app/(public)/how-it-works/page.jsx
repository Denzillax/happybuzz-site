"use client";
import Link from "next/link";
import { Camera, Tag, ShoppingBag, Truck, Star, ArrowRight, ShieldCheck, CreditCard, Gavel, Home, Gift, Wrench } from "lucide-react";
import BeeIcon from "@/components/shared/BeeIcon";
import { FEE_TIERS, DEFAULT_FEE_TIER, FEE_FREE_BELOW } from "@/lib/constants";

// ── Katalog-Design-Tokens ──
const INK = "#14110D";
const SAND = "#ECE3D2";
const PAPER = "#FBF8F2";
const HONEY = "#F4C03F";
const PETROL = "#0B5E5C";
const MOSS = "#5B8C5A";
const MUTED = "rgba(20,17,13,0.6)";
const MONO = "'Space Mono', ui-monospace, monospace";
const HEAD = "'General Sans', 'Manrope', system-ui, sans-serif";
const BODY = "'Manrope', system-ui, sans-serif";

const TYPES = [
  { icon: Tag, title: "Festpreis", desc: "Sofort kaufen zum festen Preis. Ideal für Artikel mit klarem Marktwert.", color: HONEY },
  { icon: Gavel, title: "Auktion", desc: "Bieten lassen und den besten Preis erzielen. Perfekt für Sammlerstücke und Raritäten.", color: PETROL },
  { icon: Home, title: "Miete", desc: "Artikel zeitweise vermieten statt verkaufen. Ideal für Werkzeug, Geräte, Sportartikel.", color: "#8B6DB0" },
  { icon: Wrench, title: "Service", desc: "Dienstleistungen anbieten und Termine buchen lassen. Abgerechnet nach Abschluss.", color: "#C2410C" },
  { icon: Gift, title: "Gratis", desc: "Verschenken statt wegwerfen. Nur Abholung, keine Gebühren.", color: MOSS },
];

const STEPS_SELL = [
  { icon: Camera, num: "01", title: "Fotografieren", desc: "Mach ein paar Fotos von deinem Artikel. Das Hauptbild entscheidet. Mach es gut." },
  { icon: Tag, num: "02", title: "Inserieren", desc: "Titel, Beschreibung, Kategorie und Preis. Wähle Festpreis, Auktion, Miete, Service oder Gratis." },
  { icon: ShieldCheck, num: "03", title: "Freigabe", desc: "Wir prüfen dein Inserat kurz, bevor es online geht. So bleibt der Katalog sauber." },
  { icon: ShoppingBag, num: "04", title: "Verkaufen", desc: "Jemand kauft, bietet oder bucht. Du wirst sofort benachrichtigt." },
  { icon: Truck, num: "05", title: "Versenden", desc: "Per Post verschicken oder Abholung vereinbaren. Bezahlt wird per TWINT oder Überweisung." },
];

const STEPS_BUY = [
  { icon: ShoppingBag, num: "01", title: "Stöbern", desc: "Durchsuche den Katalog nach Kategorie, Preis, Zustand oder Standort. Oder per Artikelnummer." },
  { icon: CreditCard, num: "02", title: "Kaufen oder bieten", desc: "Festpreis sofort kaufen, bei Auktionen mitbieten, bei Miete und Service einen Termin buchen." },
  { icon: Truck, num: "03", title: "Erhalten", desc: "Dein Artikel kommt per Post oder du holst ihn direkt beim Verkäufer ab." },
  { icon: Star, num: "04", title: "Bewerten", desc: "Empfang bestätigen und bewerten. So hilfst du der Community, Vertrauen aufzubauen." },
];

// Aus FEE_TIERS abgeleitet, damit Saetze und Empfehlung nie von der App abweichen.
const TIERS = FEE_TIERS.map((t) => ({
  label: t.label,
  pct: `${t.pct}%`,
  desc: t.tier === DEFAULT_FEE_TIER ? "Empfohlen" : t.desc.replace(/^Empfohlen:\s*/, ""),
  isDefault: t.tier === DEFAULT_FEE_TIER,
}));

const SAFETY = [
  { title: "Geprüfte Inserate", desc: "Jedes Inserat wird vor Veröffentlichung kurz von uns kontrolliert." },
  { title: "Bewertungen", desc: "Nach jeder Transaktion bewerten sich Käufer und Verkäufer gegenseitig." },
  { title: "Melden", desc: "Verdächtige Inserate kannst du jederzeit melden. Unser Team prüft jede Meldung." },
];

function Eyebrow({ children, color = PETROL }) {
  return (
    <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color, marginBottom: 10 }}>
      {children}
    </div>
  );
}

function StepRow({ step, last }) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 0, background: SAND, border: `1px solid ${INK}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: MONO, fontSize: 15, fontWeight: 700, color: INK,
        }}>
          {step.num}
        </div>
        {!last && <div style={{ width: 1, height: 30, background: `${INK}26`, margin: "4px 0" }} />}
      </div>
      <div style={{ paddingTop: 3 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
          <step.icon size={16} color={PETROL} />
          <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: HEAD, color: INK, margin: 0 }}>{step.title}</h3>
        </div>
        <p style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
      </div>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <div style={{ fontFamily: BODY, background: PAPER, minHeight: "100vh", color: INK }}>

      {/* ── Hero ── */}
      <div style={{
        background: SAND, padding: "64px 24px 68px", textAlign: "center",
        borderBottom: `1px solid ${INK}`,
        backgroundImage: `radial-gradient(${INK}0F 1px, transparent 1px)`, backgroundSize: "22px 22px",
      }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <Eyebrow>№ 00 · Handbuch</Eyebrow>
          <h1 style={{ fontSize: "clamp(34px, 5vw, 52px)", fontWeight: 700, fontFamily: HEAD, margin: "0 0 14px", letterSpacing: "-0.02em", lineHeight: 1.02 }}>
            So funktioniert{" "}
            <span style={{ background: HONEY, color: INK, padding: "0 .1em", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}>BEEDARO</span>
          </h1>
          <p style={{ fontSize: "clamp(15px, 1.8vw, 18px)", color: MUTED, maxWidth: 520, margin: "0 auto", lineHeight: 1.6 }}>
            Kaufen, verkaufen, mieten, buchen, verschenken. Fünf Wege, ein Katalog.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 940, margin: "0 auto", padding: "0 24px 88px" }}>

        {/* ── 5 Inserattypen ── */}
        <div style={{ margin: "52px 0" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <Eyebrow>Fünf Wege</Eyebrow>
            <h2 style={{ fontSize: "clamp(24px, 3.4vw, 32px)", fontWeight: 700, fontFamily: HEAD, margin: 0, letterSpacing: "-0.01em" }}>Was möchtest du tun?</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14 }}>
            {TYPES.map((t, i) => (
              <div key={i} style={{
                padding: "22px 18px", borderRadius: 0, background: "#fff",
                border: `1px solid ${INK}`, textAlign: "center",
              }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 0, margin: "0 auto 12px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: SAND, border: `1px solid ${INK}`, color: t.color,
                }}>
                  <t.icon size={21} color={t.color} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: HEAD, color: INK, margin: "0 0 5px" }}>{t.title}</h3>
                <p style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.5, margin: 0 }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Verkaufen / Kaufen Steps ── */}
        <div className="hiw-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 44, margin: "56px 0" }}>
          <div>
            <Eyebrow>Für Verkäufer</Eyebrow>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 700, fontFamily: HEAD, margin: "0 0 22px", letterSpacing: "-0.01em" }}>In 5 Schritten verkaufen</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {STEPS_SELL.map((s, i) => <StepRow key={i} step={s} last={i === STEPS_SELL.length - 1} />)}
            </div>
          </div>
          <div>
            <Eyebrow>Für Käufer</Eyebrow>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 700, fontFamily: HEAD, margin: "0 0 22px", letterSpacing: "-0.01em" }}>In 4 Schritten kaufen</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {STEPS_BUY.map((s, i) => <StepRow key={i} step={s} last={i === STEPS_BUY.length - 1} />)}
            </div>
          </div>
        </div>

        {/* ── Bee-Rate ── */}
        <div style={{ padding: 30, borderRadius: 0, background: "#fff", border: `1px solid ${INK}`, margin: "40px 0" }}>
          <Eyebrow>Gebührenmodell</Eyebrow>
          <h2 style={{ fontSize: "clamp(20px, 2.6vw, 26px)", fontWeight: 700, fontFamily: HEAD, margin: "0 0 12px", letterSpacing: "-0.01em" }}>Die Bee-Rate: deine Gebühr, deine Wahl</h2>
          <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.7, marginBottom: 20, maxWidth: 640 }}>
            Inserieren ist gratis. Erst bei erfolgreichem Verkauf fällt die selbst gewählte Bee-Rate an.
            Du entscheidest, wie viel du beiträgst. Das bestimmt auch, wie weit oben dein Inserat erscheint.
            Verkäufe unter CHF {FEE_FREE_BELOW}.00 sind komplett gebührenfrei.
          </p>
          <div style={{ display: "flex", border: `1.5px solid ${INK}`, borderRadius: 0, overflow: "hidden", background: "#fff", flexWrap: "wrap" }}>
            {TIERS.map((r, i) => (
              <div key={i} style={{
                flex: "1 1 130px", padding: "16px 12px", textAlign: "center",
                borderLeft: i ? `1px solid ${INK}1a` : "none",
                background: r.isDefault ? "#FBF1D2" : "#fff",
              }}>
                <div style={{ fontFamily: HEAD, fontSize: "clamp(24px, 3vw, 30px)", fontWeight: 700, color: INK, letterSpacing: "-0.01em" }}>{r.pct}</div>
                <div style={{ fontSize: 13, fontWeight: 700, fontFamily: HEAD, marginTop: 2, color: INK }}>{r.label}</div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: MUTED, marginTop: 4, letterSpacing: ".04em", textTransform: "uppercase" }}>{r.desc}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12.5, color: MUTED, marginTop: 14, display: "flex", alignItems: "center", gap: 7 }}>
            <BeeIcon size={15} color={MOSS} /> 20% jeder Gebühr fliessen als Bee-Impact in Schweizer Naturschutzprojekte.
          </p>
        </div>

        {/* ── Sicherheit ── */}
        <div style={{ padding: 30, borderRadius: 0, margin: "40px 0", background: INK, color: PAPER }}>
          <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: HONEY, marginBottom: 10 }}>Vertrauen</div>
          <h2 style={{ fontSize: "clamp(20px, 2.6vw, 26px)", fontWeight: 700, fontFamily: HEAD, margin: "0 0 20px", letterSpacing: "-0.01em" }}>Sicher handeln auf BEEDARO</h2>
          <div className="hiw-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            {SAFETY.map((s, i) => (
              <div key={i} style={{ padding: 18, borderRadius: 0, background: "rgba(251,248,242,0.06)", border: "1px solid rgba(251,248,242,0.14)" }}>
                <div style={{ fontFamily: MONO, fontSize: 12, color: HONEY, marginBottom: 8 }}>0{i + 1}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: HEAD, margin: "0 0 5px" }}>{s.title}</h3>
                <p style={{ fontSize: 12.5, color: "rgba(251,248,242,0.6)", lineHeight: 1.55, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div style={{ textAlign: "center", marginTop: 52 }}>
          <h2 style={{ fontSize: "clamp(24px, 3.4vw, 32px)", fontWeight: 700, fontFamily: HEAD, margin: "0 0 10px", letterSpacing: "-0.01em" }}>Bereit?</h2>
          <p style={{ fontSize: 15, color: MUTED, marginBottom: 24 }}>Dein Keller hat Inventar. Wir haben Käufer.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/listings/new" className="bd-btn" style={{
              padding: "14px 28px", borderRadius: 0, background: INK, color: PAPER,
              fontSize: 15, fontWeight: 700, fontFamily: BODY, textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: 8, border: `1.5px solid ${INK}`,
            }}>
              Gratis inserieren <ArrowRight size={16} />
            </Link>
            <Link href="/search" className="bd-btn" style={{
              padding: "14px 28px", borderRadius: 0, background: "#fff",
              border: `1.5px solid ${INK}`, color: INK, fontSize: 15, fontWeight: 700,
              fontFamily: BODY, textDecoration: "none",
            }}>
              Im Katalog stöbern
            </Link>
          </div>
        </div>
      </div>

      <style>{`@media (max-width: 760px) { .hiw-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
