"use client";
import Link from "next/link";
import { Heart, Users, Leaf, ShieldCheck, Briefcase, ArrowRight } from "lucide-react";
import BeeIcon from "@/components/shared/BeeIcon";

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

const VALUES = [
  { icon: Heart, title: "Secondhand mit Haltung", desc: "Jedes Ding verdient eine zweite Chance. Nicht aus Mitleid, sondern weil es besser ist." },
  { icon: Users, title: "Community First", desc: "BEEDARO gehört der Community. Faire Gebühren, transparente Regeln, kein Bullshit." },
  { icon: Leaf, title: "Bee-Impact", desc: "20% jeder Gebühr fliessen in Schweizer Naturschutzprojekte. Kein Greenwashing, echte Projekte." },
  { icon: ShieldCheck, title: "Vertrauen & Sicherheit", desc: "Geprüfte Inserate, Verifizierung und Bewertungen schaffen ein sicheres Handelsumfeld." },
];

const DIFF = [
  "Festpreis, Auktion, Miete, Service & Gratis",
  "Selbst gewählte Bee-Rate (3 bis 10%)",
  "20% für Schweizer Naturschutz",
  "Privat- und Unternehmenskonten",
  "Geprüfte Inserate & gegenseitige Bewertungen",
  "Bee-Level: Blüten, Pollen, Nektar",
];

function Eyebrow({ children, color = PETROL }) {
  return (
    <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color, marginBottom: 10 }}>
      {children}
    </div>
  );
}

export default function AboutPage() {
  return (
    <div style={{ fontFamily: BODY, background: PAPER, minHeight: "100vh", color: INK }}>

      {/* ── Hero ── */}
      <div style={{
        background: SAND, padding: "64px 24px 68px", textAlign: "center",
        borderBottom: `1px solid ${INK}`,
        backgroundImage: `radial-gradient(${INK}0F 1px, transparent 1px)`, backgroundSize: "22px 22px",
      }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <Eyebrow>Über uns</Eyebrow>
          <h1 style={{ fontSize: "clamp(34px, 5vw, 52px)", fontWeight: 700, fontFamily: HEAD, margin: "0 0 14px", letterSpacing: "-0.02em", lineHeight: 1.02 }}>
            Der Katalog der{" "}
            <span style={{ background: HONEY, color: INK, padding: "0 .1em", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}>zweiten Leben</span>
          </h1>
          <p style={{ fontSize: "clamp(15px, 1.8vw, 18px)", color: MUTED, lineHeight: 1.6 }}>
            Der Schweizer Marktplatz für Dinge mit Geschichte. Kaufen, verkaufen, mieten, buchen, verschenken. Und dabei Gutes tun.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 940, margin: "0 auto", padding: "0 24px 88px" }}>

        {/* ── Story ── */}
        <div className="about-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36, margin: "56px 0", alignItems: "center" }}>
          <div>
            <Eyebrow>Unsere Geschichte</Eyebrow>
            <h2 style={{ fontSize: "clamp(24px, 3.2vw, 30px)", fontWeight: 700, fontFamily: HEAD, margin: "0 0 14px", letterSpacing: "-0.01em" }}>Nicht neu. Nur interessanter.</h2>
            <p style={{ fontSize: 14.5, color: MUTED, lineHeight: 1.75, marginBottom: 12 }}>
              BEEDARO entstand aus einer einfachen Idee: Gebrauchte Dinge verdienen mehr als ein zweites Leben. Sie verdienen einen besseren Marktplatz. Fair für Verkäufer, Käufer und die Umwelt.
            </p>
            <p style={{ fontSize: 14.5, color: MUTED, lineHeight: 1.75 }}>
              Anders als andere Plattformen kombiniert BEEDARO Festpreis, Auktion, Miete, Service und Verschenken in einem. Mit der selbst gewählten Bee-Rate bestimmst du, wie viel du beiträgst. 20% davon gehen direkt in Schweizer Naturschutzprojekte.
            </p>
          </div>
          {/* Specimen-Statement statt Platzhalter */}
          <div style={{ position: "relative" }}>
            <div aria-hidden style={{ position: "absolute", inset: "16px -10px -10px 16px", border: `1.5px solid ${INK}`, borderRadius: 0, transform: "rotate(2.5deg)", opacity: .25 }} />
            <div style={{ position: "relative", background: INK, color: PAPER, borderRadius: 0, padding: "30px 28px", transform: "rotate(-1.5deg)", border: `1.5px solid ${INK}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: MONO, fontSize: 11, letterSpacing: ".08em", color: "rgba(251,248,242,0.7)", borderBottom: "1px solid rgba(251,248,242,0.2)", paddingBottom: 10, marginBottom: 16 }}>
                <span>№ 0001</span>
                <span style={{ background: HONEY, color: INK, padding: "3px 8px", borderRadius: 0, fontWeight: 700, fontSize: 10 }}>MANIFEST</span>
              </div>
              <p style={{ fontFamily: HEAD, fontSize: "clamp(20px, 2.6vw, 26px)", fontWeight: 600, lineHeight: 1.25, margin: 0, letterSpacing: "-0.01em" }}>
                Dein Keller hat Inventar. Wir haben Käufer.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 18, fontFamily: MONO, fontSize: 11, color: "rgba(251,248,242,0.7)" }}>
                <BeeIcon size={16} color={HONEY} /> Geprüft & katalogisiert
              </div>
            </div>
          </div>
        </div>

        {/* ── Values ── */}
        <div style={{ marginBottom: 56 }}>
          <div style={{ textAlign: "center", marginBottom: 30 }}>
            <Eyebrow>Was uns antreibt</Eyebrow>
            <h2 style={{ fontSize: "clamp(24px, 3.4vw, 32px)", fontWeight: 700, fontFamily: HEAD, margin: 0, letterSpacing: "-0.01em" }}>Unsere Werte</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
            {VALUES.map((v, i) => (
              <div key={i} style={{ padding: 24, borderRadius: 0, background: "#fff", border: `1px solid ${INK}`, textAlign: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: 0, margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center", background: SAND, border: `1px solid ${INK}` }}>
                  <v.icon size={22} color={PETROL} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, fontFamily: HEAD, color: INK, margin: "0 0 6px" }}>{v.title}</h3>
                <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.55, margin: 0 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Difference ── */}
        <div className="about-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36, margin: "56px 0", alignItems: "center" }}>
          <div>
            <Eyebrow>Was uns unterscheidet</Eyebrow>
            <h2 style={{ fontSize: "clamp(24px, 3.2vw, 30px)", fontWeight: 700, fontFamily: HEAD, margin: "0 0 14px", letterSpacing: "-0.01em" }}>Mehr als kaufen und verkaufen</h2>
            <p style={{ fontSize: 14.5, color: MUTED, lineHeight: 1.75, marginBottom: 16 }}>
              Ricardo hat Auktionen. Tutti hat Gratis-Inserate. Vinted hat Mode. BEEDARO hat alles. Und dazu ein Modell, das allen etwas zurückgibt.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {DIFF.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: INK }}>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: PETROL, flexShrink: 0 }}>0{i + 1}</span>
                  <span style={{ width: 14, height: 1, background: `${INK}33`, flexShrink: 0 }} />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: "30px 28px", borderRadius: 0, background: SAND, border: `1px solid ${INK}` }}>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".08em", color: MUTED, marginBottom: 14, textTransform: "uppercase" }}>Differenzierung</div>
            <p style={{ fontFamily: HEAD, fontSize: "clamp(19px, 2.4vw, 24px)", fontWeight: 600, lineHeight: 1.3, margin: 0, color: INK, letterSpacing: "-0.01em" }}>
              Fünf Inserattypen. Eine wählbare Gebühr. Ein Beitrag, der bei der Natur ankommt.
            </p>
          </div>
        </div>

        {/* ── Bee-Impact Band ── */}
        <div style={{ padding: 34, borderRadius: 0, textAlign: "center", marginBottom: 56, background: INK, color: PAPER }}>
          <BeeIcon size={30} color={HONEY} />
          <h2 style={{ fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 700, fontFamily: HEAD, margin: "12px 0 8px", letterSpacing: "-0.01em" }}>Bee-Impact: dein Beitrag zählt</h2>
          <p style={{ fontSize: 14.5, color: "rgba(251,248,242,0.65)", maxWidth: 520, margin: "0 auto 22px", lineHeight: 1.6 }}>
            Jede Transaktion unterstützt Schweizer Naturschutzprojekte. Nicht als Marketing-Gag, sondern als fester Bestandteil unseres Modells.
          </p>
          <Link href="/impact" className="bd-btn" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "13px 26px", borderRadius: 0, background: HONEY,
            color: INK, fontSize: 14.5, fontWeight: 700, fontFamily: BODY, textDecoration: "none",
          }}>
            Mehr erfahren <ArrowRight size={16} />
          </Link>
        </div>

        {/* ── Team ── */}
        <div style={{ marginBottom: 56 }}>
          <div style={{ textAlign: "center", marginBottom: 30 }}>
            <Eyebrow>Das Team</Eyebrow>
            <h2 style={{ fontSize: "clamp(24px, 3.4vw, 32px)", fontWeight: 700, fontFamily: HEAD, margin: 0, letterSpacing: "-0.01em" }}>Die Menschen hinter BEEDARO</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, maxWidth: 640, margin: "0 auto" }}>
            <div style={{ textAlign: "center", padding: "24px 18px", borderRadius: 0, background: "#fff", border: `1px solid ${INK}` }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", margin: "0 auto 12px", background: HONEY, border: `1px solid ${INK}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: HEAD, fontSize: 22, fontWeight: 700, color: INK }}>DM</div>
              <h4 style={{ fontSize: 15, fontWeight: 700, fontFamily: HEAD, margin: "0 0 2px", color: INK }}>Denis Mihaljevic</h4>
              <p style={{ fontFamily: MONO, fontSize: 11, color: MUTED, margin: 0, letterSpacing: ".04em" }}>GRÜNDER & DESIGN</p>
            </div>
            <div style={{ textAlign: "center", padding: "24px 18px", borderRadius: 0, background: SAND, border: `1px dashed ${INK}66`, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", margin: "0 auto 12px", background: PAPER, border: `1px dashed ${INK}66`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: HEAD, fontSize: 26, fontWeight: 700, color: MUTED }}>+</div>
              <h4 style={{ fontSize: 15, fontWeight: 700, fontFamily: HEAD, margin: "0 0 2px", color: INK }}>Wir wachsen</h4>
              <p style={{ fontFamily: MONO, fontSize: 11, color: MUTED, margin: 0, letterSpacing: ".04em" }}>DEIN PLATZ?</p>
            </div>
          </div>
        </div>

        {/* ── Jobs ── */}
        <div id="jobs">
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <Briefcase size={26} color={PETROL} style={{ marginBottom: 8 }} />
            <h2 style={{ fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 700, fontFamily: HEAD, margin: "0 0 6px", letterSpacing: "-0.01em" }}>Jobs</h2>
            <p style={{ fontSize: 14, color: MUTED }}>Arbeiten bei BEEDARO</p>
          </div>
          <div style={{ padding: 32, borderRadius: 0, background: "#fff", border: `1px solid ${INK}`, textAlign: "center" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: HEAD, margin: "0 0 6px", color: INK }}>Zurzeit keine offenen Stellen</h3>
            <p style={{ fontSize: 13.5, color: MUTED, maxWidth: 420, margin: "0 auto", lineHeight: 1.6 }}>
              Wir sind ein kleines Team mit grossen Plänen. Initiativbewerbungen sind willkommen. Schreib uns an <a href="mailto:jobs@beedaro.ch" style={{ color: PETROL, fontWeight: 700 }}>jobs@beedaro.ch</a>.
            </p>
          </div>
        </div>
      </div>

      <style>{`@media (max-width: 760px) { .about-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
