"use client";
import Link from "next/link";
import { Heart, Users, Leaf, ShieldCheck, Briefcase, ArrowRight } from "lucide-react";
import { colors, fonts, radius } from "@/lib/theme";
import BeeIcon from "@/components/shared/BeeIcon";

const VALUES = [
  { icon: Heart, title: "Secondhand mit Haltung", desc: "Wir glauben daran, dass jedes Ding eine zweite Chance verdient. Nicht aus Mitleid, sondern weil es besser ist." },
  { icon: Users, title: "Community First", desc: "BEEDARO gehört der Community. Faire Gebühren, transparente Regeln, kein Bullshit." },
  { icon: Leaf, title: "Bee-Impact", desc: "20% jeder Gebühr fliessen in Schweizer Naturschutzprojekte. Kein Greenwashing, echte Projekte." },
  { icon: ShieldCheck, title: "Vertrauen & Sicherheit", desc: "Trust Level, Verifizierung und Bewertungen schaffen ein sicheres Handelsumfeld." },
];

function Placeholder({ text, height = 320, color = "#e8e5e0" }) {
  return (
    <div style={{
      width: "100%", height, borderRadius: 16, background: color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 13, color: "#999", fontWeight: 600, fontFamily: fonts.body,
      border: "2px dashed #d0cdc8",
    }}>
      {text}
    </div>
  );
}

export default function AboutPage() {
  return (
    <div style={{ fontFamily: fonts.body, background: colors.cream, minHeight: "100vh", color: colors.dark }}>

      {/* ── Hero ── */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.dark} 0%, #2a2520 100%)`,
        padding: "64px 20px 72px", textAlign: "center", color: "#fff",
      }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <BeeIcon size={40} color={colors.yellow} />
          <h1 style={{ fontSize: 36, fontWeight: 900, fontFamily: fonts.head, margin: "12px 0 8px", letterSpacing: ".03em" }}>
            Über BEEDARO
          </h1>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,.6)", lineHeight: 1.6 }}>
            Der Schweizer Marktplatz für Dinge mit Geschichte.
            Kaufen, verkaufen, mieten, verschenken. Und dabei Gutes tun.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px 80px" }}>

        {/* ── Story ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, margin: "48px 0", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: colors.yellow, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Unsere Geschichte</div>
            <h2 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 14px" }}>Nicht neu. Nur interessanter.</h2>
            <p style={{ fontSize: 14, color: colors.muted, lineHeight: 1.7, marginBottom: 12 }}>
              BEEDARO entstand aus einer einfachen Idee: Ein Schweizer Marktplatz, der Secondhand nicht als Notlösung behandelt, sondern als bewusste Entscheidung. Einer, der fair ist. Für Verkäufer, Käufer und die Umwelt.
            </p>
            <p style={{ fontSize: 14, color: colors.muted, lineHeight: 1.7 }}>
              Anders als andere Plattformen kombiniert BEEDARO Festpreis, Auktionen, Vermietung und Verschenken in einem. Mit der selbst gewählten Bee-Rate bestimmst du, wie viel du beitragen willst. 20% davon gehen direkt in Schweizer Naturschutzprojekte.
            </p>
          </div>
          <Placeholder text="Bild: Gründer / Team (Platzhalter)" height={340} />
        </div>

        {/* ── Values ── */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: colors.yellow, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Was uns antreibt</div>
            <h2 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>Unsere Werte</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {VALUES.map((v, i) => (
              <div key={i} style={{
                padding: 24, borderRadius: 12, background: "#fff",
                border: `1px solid ${colors.border}`,
                textAlign: "center",
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, margin: "0 auto 12px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: colors.yellowSoft,
                }}>
                  <v.icon size={22} color={colors.yellow} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 6px" }}>{v.title}</h3>
                <p style={{ fontSize: 13, color: colors.muted, lineHeight: 1.5, margin: 0 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Difference ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, margin: "48px 0", alignItems: "center" }}>
          <Placeholder text="Bild: Plattform / App Screenshot (Platzhalter)" height={300} color="#f0ece6" />
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: colors.yellow, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Was uns unterscheidet</div>
            <h2 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 14px" }}>Mehr als nur kaufen und verkaufen</h2>
            <p style={{ fontSize: 14, color: colors.muted, lineHeight: 1.7, marginBottom: 12 }}>
              Ricardo hat Auktionen. Tutti hat Gratis-Inserate. Vinted hat Mode. BEEDARO hat alles. Und dazu ein Modell, das allen etwas zurückgibt.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {["Festpreis, Auktionen, Mieten & Verschenken", "Selbst gewählte Bee-Rate (3-10%)", "20% für Schweizer Naturschutz", "Trust Level durch Verifizierung", "Bee-Level Gamification"].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: colors.dark }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: colors.yellow, flexShrink: 0 }} />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Bee-Impact ── */}
        <div style={{
          padding: 32, borderRadius: 16, textAlign: "center", marginBottom: 48,
          background: `linear-gradient(135deg, ${colors.dark} 0%, #2a2520 100%)`, color: "#fff",
        }}>
          <BeeIcon size={32} color={colors.yellow} />
          <h2 style={{ fontSize: 22, fontWeight: 900, margin: "12px 0 8px" }}>Bee-Impact: Dein Beitrag zählt</h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,.6)", maxWidth: 500, margin: "0 auto 20px", lineHeight: 1.6 }}>
            Jede Transaktion auf BEEDARO unterstützt Schweizer Naturschutzprojekte. Nicht als Marketing-Gag, sondern als fester Bestandteil unseres Modells.
          </p>
          <Link href="/impact" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "12px 24px", borderRadius: 8, background: colors.yellow,
            color: colors.dark, fontSize: 14, fontWeight: 700, textDecoration: "none",
          }}>
            Mehr erfahren <ArrowRight size={16} />
          </Link>
        </div>

        {/* ── Team ── */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: colors.yellow, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Das Team</div>
            <h2 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>Die Menschen hinter BEEDARO</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 20 }}>
            {[
              { name: "Denis Mihaljevic", role: "Gründer & Design", placeholder: "Foto (Platzhalter)" },
              { name: "Dein Name?", role: "Entwicklung", placeholder: "Foto (Platzhalter)" },
              { name: "Dein Name?", role: "Community", placeholder: "Foto (Platzhalter)" },
            ].map((m, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{
                  width: "100%", aspectRatio: "1", borderRadius: 12, marginBottom: 12,
                  background: "#e8e5e0", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, color: "#999", fontWeight: 600, border: "2px dashed #d0cdc8",
                }}>
                  {m.placeholder}
                </div>
                <h4 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 2px" }}>{m.name}</h4>
                <p style={{ fontSize: 12, color: colors.muted, margin: 0 }}>{m.role}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Jobs ── */}
        <div id="jobs" style={{ marginBottom: 32 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <Briefcase size={28} color={colors.yellow} style={{ marginBottom: 8 }} />
            <h2 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 8px" }}>Jobs</h2>
            <p style={{ fontSize: 14, color: colors.muted }}>Arbeiten bei BEEDARO</p>
          </div>
          <div style={{
            padding: 32, borderRadius: 12, background: "#fff",
            border: `1px solid ${colors.border}`, textAlign: "center",
          }}>
            <Briefcase size={36} color={colors.muted} style={{ marginBottom: 12, opacity: 0.4 }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px", color: colors.dark }}>Zurzeit keine offenen Stellen</h3>
            <p style={{ fontSize: 13, color: colors.muted, maxWidth: 400, margin: "0 auto", lineHeight: 1.5 }}>
              Wir sind ein kleines Team mit grossen Plänen. Initiativbewerbungen sind willkommen — schreib uns an <a href="mailto:jobs@beedaro.ch" style={{ color: colors.yellow, fontWeight: 700 }}>jobs@beedaro.ch</a>
            </p>
          </div>
        </div>
      </div>

      <style>{`@media (max-width: 700px) { .about-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
