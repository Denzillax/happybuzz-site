"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, TreePine, Droplets, Bird, ArrowRight, TrendingUp, Users, ShoppingBag } from "lucide-react";
import { colors, fonts, radius } from "@/lib/theme";
import { supabase } from "@/lib/supabase/supabase";
import BeeIcon from "@/components/shared/BeeIcon";

const PROJECTS = [
  { icon: TreePine, title: "Waldschutz Schweiz", desc: "Aufforstung und Schutz einheimischer Wälder in den Voralpen. Über 2'000 Bäume gepflanzt.", status: "Aktiv", color: "#5B8C5A" },
  { icon: Droplets, title: "Gewässerschutz Mittelland", desc: "Renaturierung von Bächen und Feuchtgebieten im Schweizer Mittelland.", status: "Geplant", color: "#94B9C9" },
  { icon: Bird, title: "Biodiversität Alpenraum", desc: "Schutz und Förderung bedrohter Tier- und Pflanzenarten in den Schweizer Alpen.", status: "Geplant", color: "#F4A100" },
];

const LEVELS = [
  { name: "Bee Starter", min: 0, max: 10, desc: "Willkommen bei BEEDARO" },
  { name: "Busy Bee", min: 10, max: 50, desc: "Du bist aktiv dabei" },
  { name: "Hive Builder", min: 50, max: 150, desc: "Du baust mit an der Community" },
  { name: "Queen Bee", min: 150, max: 500, desc: "Top-Contributor" },
  { name: "Bee Legend", min: 500, max: null, desc: "Legende der Community" },
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

  return (
    <div style={{ fontFamily: fonts.body, background: colors.cream, minHeight: "100vh", color: colors.dark }}>

      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, #2d4a2d 0%, #1a2e1a 100%)`,
        padding: "56px 20px 64px", textAlign: "center", color: "#fff",
      }}>
        <BeeIcon size={40} color={colors.yellow} />
        <h1 style={{ fontSize: 32, fontWeight: 900, fontFamily: fonts.head, margin: "12px 0 8px", letterSpacing: ".03em" }}>
          Bee-Impact
        </h1>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,.55)", maxWidth: 520, margin: "0 auto" }}>
          Jede Transaktion auf BEEDARO unterstützt Schweizer Naturschutzprojekte.
          Nicht als Versprechen. Als Fakt.
        </p>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px 80px" }}>

        {/* Counter */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16,
          margin: "-32px 0 40px", position: "relative", zIndex: 1,
        }}>
          {[
            { icon: TrendingUp, label: "Bee-Impact gesamt", value: `CHF ${stats.total.toFixed(2)}` },
            { icon: ShoppingBag, label: "Transaktionen", value: String(stats.count) },
            { icon: Heart, label: "Für Naturschutz", value: "20% jeder Gebühr" },
          ].map((s, i) => (
            <div key={i} style={{
              padding: 20, borderRadius: 12, background: "#fff",
              border: `1px solid ${colors.border}`, textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,.06)",
            }}>
              <s.icon size={20} color={colors.yellow} style={{ marginBottom: 6 }} />
              <div style={{ fontSize: 24, fontWeight: 900, fontFamily: fonts.head, color: colors.dark }}>{s.value}</div>
              <div style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* So funktioniert's */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#5B8C5A", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>So funktioniert es</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>Von deinem Verkauf zum Naturschutz</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            {[
              { num: "1", title: "Du verkaufst", desc: "Jeder erfolgreiche Verkauf generiert eine Bee-Rate Gebühr (3-10%, selbst gewählt)." },
              { num: "2", title: "20% für die Natur", desc: "Ein Fünftel deiner Gebühr fliesst automatisch als Bee-Impact in den Naturschutz-Topf." },
              { num: "3", title: "Projekte werden finanziert", desc: "Der gesammelte Bee-Impact finanziert konkrete Schweizer Naturschutzprojekte." },
            ].map((s, i) => (
              <div key={i} style={{
                padding: 20, borderRadius: 12, background: "#fff",
                border: `1px solid ${colors.border}`, textAlign: "center",
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", margin: "0 auto 10px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "#5B8C5A", color: "#fff", fontSize: 16, fontWeight: 900, fontFamily: fonts.head,
                }}>{s.num}</div>
                <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 4px" }}>{s.title}</h3>
                <p style={{ fontSize: 12, color: colors.muted, lineHeight: 1.5, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Rechenbeispiel */}
        <div style={{
          padding: 24, borderRadius: 12, background: "#fff",
          border: `1px solid ${colors.border}`, marginBottom: 48,
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 14px" }}>Rechenbeispiel</h3>
          <div style={{ fontSize: 14, color: colors.muted, lineHeight: 1.8 }}>
            Du verkaufst einen Artikel für <strong style={{ color: colors.dark }}>CHF 100.00</strong> mit der Bee-Rate <strong style={{ color: colors.dark }}>Supporter (5%)</strong>.<br />
            Gebühr: CHF 5.00 — davon <strong style={{ color: "#5B8C5A" }}>CHF 1.00 Bee-Impact</strong> für den Naturschutz.<br />
            Du erhältst: <strong style={{ color: colors.dark }}>CHF 95.00</strong>.
            Käufer und Verkäufer sammeln dafür gleich viele Blüten für ihr Bee-Level.
          </div>
        </div>

        {/* Projekte */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#5B8C5A", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Unsere Projekte</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>Wohin fliesst dein Beitrag?</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            {PROJECTS.map((p, i) => (
              <div key={i} style={{
                borderRadius: 12, overflow: "hidden", background: "#fff",
                border: `1px solid ${colors.border}`,
              }}>
                <div style={{
                  height: 140, background: `${p.color}18`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderBottom: `1px solid ${colors.border}`,
                }}>
                  <p.icon size={40} color={p.color} style={{ opacity: 0.6 }} />
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>{p.title}</h3>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                      background: p.status === "Aktiv" ? "#E8F5E9" : colors.cream,
                      color: p.status === "Aktiv" ? "#2E7D32" : colors.muted,
                    }}>{p.status}</span>
                  </div>
                  <p style={{ fontSize: 12, color: colors.muted, lineHeight: 1.5, margin: 0 }}>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bee-Level */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: colors.yellow, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Gamification</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>Dein Bee-Level</h2>
            <p style={{ fontSize: 13, color: colors.muted, marginTop: 6 }}>Je mehr Blüten du sammelst, desto höher dein Level.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {LEVELS.map((l, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
                borderRadius: 10, background: "#fff", border: `1px solid ${colors.border}`,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", display: "flex",
                  alignItems: "center", justifyContent: "center", flexShrink: 0,
                  background: i === 0 ? colors.cream : colors.yellowSoft,
                }}>
                  <BeeIcon size={18} color={i === 0 ? colors.muted : colors.yellow} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{l.name}</div>
                  <div style={{ fontSize: 12, color: colors.muted }}>{l.desc}</div>
                </div>
                <div style={{ fontSize: 12, color: colors.muted, fontWeight: 600 }}>
                  {l.max ? `${(l.min * 10).toLocaleString("de-CH")} – ${(l.max * 10).toLocaleString("de-CH")} Blüten` : `ab ${(l.min * 10).toLocaleString("de-CH")} Blüten`}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{
          padding: 32, borderRadius: 16, textAlign: "center",
          background: `linear-gradient(135deg, #2d4a2d 0%, #1a2e1a 100%)`, color: "#fff",
        }}>
          <BeeIcon size={32} color={colors.yellow} />
          <h2 style={{ fontSize: 22, fontWeight: 900, margin: "12px 0 8px" }}>Mach mit</h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,.55)", maxWidth: 450, margin: "0 auto 20px", lineHeight: 1.6 }}>
            Jeder Verkauf, jeder Kauf, jede Buchung trägt bei. Nicht viel pro Transaktion, aber zusammen bewegen wir etwas.
          </p>
          <Link href="/listings/new" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "14px 28px", borderRadius: 8, background: colors.yellow,
            color: colors.dark, fontSize: 14, fontWeight: 700, textDecoration: "none",
          }}>
            Jetzt inserieren <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
