"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { TreePine, Droplets, Bird, ArrowRight, Flower2, Leaf } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
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

const PROJECTS = [
  { icon: TreePine, title: "Waldschutz Schweiz", desc: "Aufforstung und Schutz einheimischer Wälder in den Voralpen. Über 2'000 Bäume gepflanzt.", status: "Aktiv", color: MOSS },
  { icon: Droplets, title: "Gewässerschutz Mittelland", desc: "Renaturierung von Bächen und Feuchtgebieten im Schweizer Mittelland.", status: "Geplant", color: PETROL },
  { icon: Bird, title: "Biodiversität Alpenraum", desc: "Schutz bedrohter Tier- und Pflanzenarten in den Schweizer Alpen.", status: "Geplant", color: "#C2410C" },
];

const FUNNEL = [
  { icon: Flower2, color: MOSS, title: "Blüten", desc: "Jede Transaktion (Kauf und Verkauf) bringt Blüten. Dein Naturschutz-Beitrag in Punkten." },
  { icon: null, color: HONEY, title: "Pollen", desc: "100 Blüten = 1 Pollen. Plus Pollen fürs Mitmachen. Pollen heben dein Bee-Level." },
  { icon: Droplets, color: "#C8860A", title: "Nektar", desc: "Level-Ups und Meilensteine schenken Nektar. Damit holst du dir Boosts und Belohnungen." },
];

const FLOW = [
  { num: "01", title: "Du verkaufst", desc: "Jeder erfolgreiche Verkauf erzeugt eine Bee-Rate Gebühr (3 bis 10%, selbst gewählt)." },
  { num: "02", title: "20% für die Natur", desc: "Ein Fünftel deiner Gebühr fliesst automatisch als Bee-Impact in den Naturschutz-Topf." },
  { num: "03", title: "Projekte werden finanziert", desc: "Der gesammelte Bee-Impact finanziert konkrete Schweizer Naturschutzprojekte." },
];

export default function ImpactPage() {
  const [stats, setStats] = useState({ total: 0, count: 0 });

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase.rpc("get_community_impact_stats");
        if (data) setStats({ total: Number(data.impact) || 0, count: data.articles || 0 });
      } catch {}
    }
    load();
  }, []);

  const ledger = [
    { label: "Bee-Impact gesamt", value: `CHF ${stats.total.toLocaleString("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    { label: "Transaktionen", value: String(stats.count) },
    { label: "Für Naturschutz", value: "20%" },
  ];

  return (
    <div style={{ fontFamily: BODY, background: PAPER, minHeight: "100vh", color: INK }}>

      {/* ── Hero ── */}
      <div style={{
        background: SAND, padding: "64px 24px 88px", textAlign: "center",
        borderBottom: `1px solid ${INK}`,
        backgroundImage: `radial-gradient(${INK}0F 1px, transparent 1px)`, backgroundSize: "22px 22px",
      }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: MOSS, marginBottom: 10, display: "inline-flex", alignItems: "center", gap: 7 }}>
            <Leaf size={14} color={MOSS} /> Bee-Impact
          </div>
          <h1 style={{ fontSize: "clamp(34px, 5vw, 52px)", fontWeight: 700, fontFamily: HEAD, margin: "0 0 14px", letterSpacing: "-0.02em", lineHeight: 1.02 }}>
            Handeln, das{" "}
            <span style={{ background: HONEY, color: INK, padding: "0 .1em", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}>etwas zurückgibt</span>
          </h1>
          <p style={{ fontSize: "clamp(15px, 1.8vw, 18px)", color: MUTED, maxWidth: 540, margin: "0 auto", lineHeight: 1.6 }}>
            Jede Transaktion auf BEEDARO unterstützt Schweizer Naturschutzprojekte. Nicht als Versprechen, als Fakt.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 940, margin: "0 auto", padding: "0 24px 88px" }}>

        {/* ── Ledger Counter ── */}
        <div style={{ display: "flex", border: `1.5px solid ${INK}`, borderRadius: 12, overflow: "hidden", background: "#fff", margin: "-44px 0 48px", position: "relative", zIndex: 1, flexWrap: "wrap", boxShadow: "0 16px 38px rgba(20,17,13,.12)" }}>
          {ledger.map((s, i) => (
            <div key={i} style={{ flex: "1 1 160px", padding: "20px 16px", borderLeft: i ? `1px solid ${INK}1a` : "none", display: "flex", flexDirection: "column", gap: 7 }}>
              <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".1em", textTransform: "uppercase", color: MUTED }}>{s.label}</span>
              <span style={{ fontFamily: HEAD, fontWeight: 700, color: INK, fontSize: "clamp(22px, 3.4vw, 30px)", letterSpacing: "-0.01em", lineHeight: 1 }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* ── Flow ── */}
        <div style={{ marginBottom: 52 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: PETROL, marginBottom: 10 }}>So funktioniert es</div>
            <h2 style={{ fontSize: "clamp(24px, 3.4vw, 32px)", fontWeight: 700, fontFamily: HEAD, margin: 0, letterSpacing: "-0.01em" }}>Von deinem Verkauf zum Naturschutz</h2>
          </div>
          <div className="impact-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            {FLOW.map((s, i) => (
              <div key={i} style={{ padding: "22px 20px", borderRadius: 12, background: "#fff", border: `1px solid ${INK}` }}>
                <div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700, color: INK, lineHeight: 1, marginBottom: 12 }}>{s.num}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: HEAD, color: INK, margin: "0 0 6px" }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.55, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Rechenbeispiel ── */}
        <div style={{ padding: 28, borderRadius: 12, background: INK, color: PAPER, marginBottom: 52 }}>
          <div style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: HONEY, marginBottom: 12 }}>Rechenbeispiel</div>
          <div style={{ fontSize: 15, lineHeight: 1.9 }}>
            Du verkaufst einen Artikel für <strong>CHF 100.00</strong> mit der Bee-Rate <strong>Supporter (5%)</strong>.<br />
            Gebühr: CHF 5.00. Davon <strong style={{ color: HONEY }}>CHF 1.00 Bee-Impact</strong> für den Naturschutz.<br />
            Du erhältst <strong>CHF 95.00</strong>. Käufer und Verkäufer sammeln dafür gleich viele Blüten fürs Bee-Level.
          </div>
        </div>

        {/* ── Projekte ── */}
        <div style={{ marginBottom: 52 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: MOSS, marginBottom: 10 }}>Unsere Projekte</div>
            <h2 style={{ fontSize: "clamp(24px, 3.4vw, 32px)", fontWeight: 700, fontFamily: HEAD, margin: 0, letterSpacing: "-0.01em" }}>Wohin dein Beitrag fliesst</h2>
          </div>
          <div className="impact-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            {PROJECTS.map((p, i) => (
              <div key={i} style={{ borderRadius: 12, overflow: "hidden", background: "#fff", border: `1px solid ${INK}` }}>
                <div style={{ height: 130, background: SAND, display: "flex", alignItems: "center", justifyContent: "center", borderBottom: `1px solid ${INK}` }}>
                  <p.icon size={38} color={p.color} />
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <h3 style={{ fontSize: 14.5, fontWeight: 700, fontFamily: HEAD, color: INK, margin: 0 }}>{p.title}</h3>
                    <span style={{
                      fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase",
                      padding: "3px 7px", borderRadius: 4, whiteSpace: "nowrap",
                      background: p.status === "Aktiv" ? MOSS : "transparent",
                      color: p.status === "Aktiv" ? PAPER : MUTED,
                      border: p.status === "Aktiv" ? "none" : `1px solid ${INK}40`,
                    }}>{p.status}</span>
                  </div>
                  <p style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.5, margin: 0 }}>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: MUTED, marginTop: 14, textAlign: "center" }}>
            Partner u. a. FreeTheBees und BienenSchweiz. Projekte werden laufend ergänzt.
          </p>
        </div>

        {/* ── Gamification Funnel ── */}
        <div style={{ marginBottom: 52 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: PETROL, marginBottom: 10 }}>Gamification</div>
            <h2 style={{ fontSize: "clamp(24px, 3.4vw, 32px)", fontWeight: 700, fontFamily: HEAD, margin: 0, letterSpacing: "-0.01em" }}>So wirst du belohnt</h2>
            <p style={{ fontSize: 14, color: MUTED, marginTop: 8 }}>Blüten werden zu Pollen, Pollen heben dein Bee-Level, Level schenken Nektar.</p>
          </div>
          <div className="impact-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            {FUNNEL.map((s, i) => (
              <div key={i} style={{ padding: "20px 18px", borderRadius: 12, background: "#fff", border: `1px solid ${INK}`, textAlign: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: SAND, border: `1px solid ${INK}`, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  {s.icon ? <s.icon size={20} color={s.color} /> : <BeeIcon size={20} color={s.color} />}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: PETROL, marginBottom: 4, letterSpacing: ".1em" }}>SCHRITT {i + 1}</div>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: HEAD, color: INK, marginBottom: 6 }}>{s.title}</div>
                <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.55 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div style={{ padding: 36, borderRadius: 12, textAlign: "center", background: SAND, border: `1px solid ${INK}` }}>
          <BeeIcon size={30} color={INK} />
          <h2 style={{ fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 700, fontFamily: HEAD, margin: "12px 0 8px", letterSpacing: "-0.01em" }}>Mach mit</h2>
          <p style={{ fontSize: 14.5, color: MUTED, maxWidth: 460, margin: "0 auto 22px", lineHeight: 1.6 }}>
            Jeder Verkauf, jeder Kauf, jede Buchung trägt bei. Wenig pro Transaktion, zusammen viel.
          </p>
          <Link href="/listings/new" className="bd-btn" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "14px 28px", borderRadius: 10, background: INK, color: PAPER,
            fontSize: 15, fontWeight: 700, fontFamily: BODY, textDecoration: "none", border: `1.5px solid ${INK}`,
          }}>
            Jetzt inserieren <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <style>{`@media (max-width: 760px) { .impact-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
