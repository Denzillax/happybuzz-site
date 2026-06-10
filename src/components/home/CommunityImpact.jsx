"use client";

import { useState, useEffect } from "react";
import { Leaf } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { getCommunityImpactStats } from "@/lib/listings";

const GREEN = "#5B8C5A";
const DARK = "#04151F";
const MUTED = "#757575";
const HEAD = "'General Sans', 'Manrope', system-ui, sans-serif";

const chf = (n) => Math.round(Number(n || 0)).toLocaleString("de-CH");

export function CommunityImpact() {
  const [stats, setStats] = useState({ impact: 0, articles: 0 });
  const [userImpact, setUserImpact] = useState(0);
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    getCommunityImpactStats().then(setStats).catch(() => {});
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase.from("profiles").select("first_name, display_name, bee_impact_total").eq("id", session.user.id).maybeSingle();
        if (profile) {
          setUserImpact(profile.bee_impact_total || 0);
          setFirstName(profile.first_name || profile.display_name || "");
        }
      }
    }
    loadUser();
  }, []);

  if (!stats || stats.impact <= 0) return null;

  // CO2-Schaetzung: ~25 kg vermieden pro wiederverwendetem Artikel.
  const co2t = (stats.articles * 25 / 1000);
  const cards = [
    { value: Number(stats.articles).toLocaleString("de-CH"), label: "Artikel gerettet" },
    { value: `${co2t.toFixed(1)}t`, label: "CO2 vermieden" },
    { value: `CHF ${chf(stats.impact)}`, label: "für Naturschutz" },
  ];

  return (
    <section style={{
      width: "100%",
      background: "linear-gradient(180deg, rgba(91,140,90,0.10) 0%, rgba(91,140,90,0.03) 100%)",
      padding: "36px 20px",
    }}>
      <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <Leaf size={15} color={GREEN} />
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: GREEN }}>Bee-Impact</span>
        </div>
        <h2 style={{ margin: "0 0 20px", fontSize: 26, fontWeight: 800, fontFamily: HEAD, color: DARK, letterSpacing: ".01em" }}>
          Gemeinsam bewirken
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {cards.map((c) => (
            <div key={c.label} style={{
              background: "#fff", border: "1px solid #E2E2E2", borderRadius: 16,
              padding: "16px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            }}>
              <span style={{ fontFamily: HEAD, fontWeight: 800, color: DARK, lineHeight: 1.1, fontSize: "clamp(18px, 5.2vw, 28px)" }}>{c.value}</span>
              <span style={{ fontSize: "clamp(10px, 2.6vw, 12px)", color: MUTED, fontWeight: 600 }}>{c.label}</span>
            </div>
          ))}
        </div>

        {userImpact > 0 && (
          <p style={{ margin: "16px 0 0", fontSize: 13, color: MUTED }}>
            Dein Beitrag: <b style={{ color: GREEN }}>CHF {Number(userImpact).toLocaleString("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>{firstName ? `. Danke, ${firstName}.` : "."}
          </p>
        )}
      </div>
    </section>
  );
}
