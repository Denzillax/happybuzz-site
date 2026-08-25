"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Leaf, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { getCommunityImpactStats } from "@/lib/listings";
import { nextMilestone } from "@/lib/impact";

const MOSS = "#5B8C5A";
const INK = "#14110D";
const PAPER = "#FFFFFF";
const SAND = "#F4F4F2";
const HONEY = "#F4C03F";
const PETROL = "#0B5E5C";
const MUTED = "rgba(20,17,13,0.55)";
const HEAD = "'General Sans', 'Manrope', system-ui, sans-serif";
const MONO = "'Manrope', sans-serif";

const chf = (n) => Math.round(Number(n || 0)).toLocaleString("de-CH");

// Ein einzelnes, dezentes Foto statt Karussell (Klar-Look)
const PHOTO = { src: "/images/bee-impact.jpg", alt: "Biene auf einer Blume mit Vintage-Polaroid-Kamera" };

export function CommunityImpact() {
  const [stats, setStats] = useState({ impact: 0, unterwegs: 0, articles: 0 });
  const [userImpact, setUserImpact] = useState(0);
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    getCommunityImpactStats().then(setStats).catch(() => {});
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data: profile } = await supabase.from("profiles").select("first_name, display_name").eq("id", session.user.id).maybeSingle();
      if (profile) setFirstName(profile.first_name || profile.display_name || "");
      // Eigener Beitrag = Bee-Impact aus den EIGENEN Verkäufen (fee_ledger),
      // gleiche Basis wie der Community-Zähler -> alle Einzelbeiträge summieren
      // sich exakt zum Gesamtbetrag. RLS: jeder sieht nur eigene Zeilen.
      const { data: rows } = await supabase.from("fee_ledger").select("bee_impact").eq("seller_id", session.user.id).eq("status", "paid");
      if (rows) setUserImpact(rows.reduce((s, r) => s + Number(r.bee_impact || 0), 0));
    }
    loadUser();
  }, []);

  if (!stats || (Number(stats.impact || 0) <= 0 && Number(stats.unterwegs || 0) <= 0)) return null;

  // CO2-Schaetzung: ~25 kg vermieden pro wiederverwendetem Artikel.
  const co2t = (stats.articles * 25 / 1000);
  const cards = [
    { value: Number(stats.articles).toLocaleString("de-CH"), label: "Artikel gerettet" },
    { value: `${co2t.toFixed(1)}t`, label: "CO2 vermieden" },
    { value: `CHF ${chf(stats.impact)}`, label: "an Projekte" },
  ];

  return (
    <section style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 24px 28px" }}>
      {/* Weiches, gruen getoentes Band im Stil von Hero und Beta-Karte */}
      <div style={{ background: "#EEF3EC", borderRadius: 14, padding: "clamp(22px, 3.5vw, 36px)" }}>
      <div className="impact-layout">
        {/* ── Foto-Karussell ── */}
        <div className="impact-photo" style={{
          position: "relative", borderRadius: 12, overflow: "hidden",
          background: "#fff",
          aspectRatio: "3 / 2",
        }}>
          <Image src={PHOTO.src} alt={PHOTO.alt} fill
            sizes="(max-width: 768px) 320px, 300px"
            style={{ objectFit: "cover" }} />
        </div>

        {/* ── Inhalt ── */}
        <div className="impact-content">
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
            <Leaf size={14} color={MOSS} />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: MOSS }}>Bee-Impact</span>
          </div>
          <h2 style={{ margin: "0 0 16px", fontSize: "clamp(20px, 2.4vw, 26px)", fontWeight: 700, fontFamily: HEAD, color: INK, letterSpacing: "-0.01em", lineHeight: 1.15 }}>
            Gemeinsam bewirken
          </h2>

          <div style={{ display: "flex", gap: "clamp(14px, 3vw, 34px)", flexWrap: "wrap" }}>
            {cards.map((c) => (
              <div key={c.label} style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                <span style={{ fontFamily: HEAD, fontWeight: 700, color: INK, lineHeight: 1, fontSize: "clamp(20px, 3.6vw, 27px)", letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums" }}>{c.value}</span>
                <span style={{ fontSize: 12, color: MUTED, whiteSpace: "nowrap" }}>{c.label}</span>
              </div>
            ))}
          </div>

          {(() => {
            const ms = nextMilestone(stats.impact);
            const span = Math.max(1, ms.target - ms.prev);
            const paidPct = Math.max(0, Math.min(100, ((Number(stats.impact || 0) - ms.prev) / span) * 100));
            const wegPct = Math.max(0, Math.min(100 - paidPct, (Number(stats.unterwegs || 0) / span) * 100));
            const remaining = Math.max(0, ms.target - Number(stats.impact || 0));
            return (
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid rgba(25,22,21,.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                  <span style={{ fontFamily: HEAD, fontSize: 13.5, fontWeight: 700, color: INK }}>Nächstes Ziel: {ms.name}</span>
                  <span style={{ fontSize: 11.5, color: MUTED, fontVariantNumeric: "tabular-nums" }}>CHF {chf(stats.impact)} / {chf(ms.target)}</span>
                </div>
                <div style={{ height: 10, borderRadius: 999, background: "#fff", marginTop: 10, overflow: "hidden", display: "flex" }}>
                  <div style={{ width: `${paidPct}%`, background: MOSS }} />
                  <div style={{ width: `${wegPct}%`, background: "repeating-linear-gradient(45deg,#F4C03F,#F4C03F 5px,#F7E3A8 5px,#F7E3A8 10px)" }} />
                </div>
                <p style={{ margin: "9px 0 0", fontSize: 12.5, color: MUTED }}>
                  {ms.reached
                    ? <>Alle Ziele erreicht. <b style={{ color: "#854F0B" }}>CHF {chf(stats.unterwegs)} unterwegs.</b></>
                    : <>Noch <b style={{ color: MOSS }}>CHF {chf(remaining)}</b>{Number(stats.unterwegs || 0) > 0 ? <>. <b style={{ color: "#854F0B" }}>CHF {chf(stats.unterwegs)} schon unterwegs.</b></> : "."}</>}
                </p>
              </div>
            );
          })()}

          {userImpact > 0 && (
            <p style={{ margin: "16px 0 0", fontSize: 13, color: MUTED }}>
              Von dir beigetragen: <b style={{ color: MOSS }}>CHF {Number(userImpact).toLocaleString("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>{firstName ? `. Danke, ${firstName}.` : "."}
            </p>
          )}

          <Link href="/impact" className="bd-btn" style={{
            display: "inline-flex", alignItems: "center", gap: 8, marginTop: 20,
            padding: "11px 22px", borderRadius: 999, background: HONEY, color: INK,
            fontSize: 14, fontWeight: 700, fontFamily: HEAD, textDecoration: "none",
          }}>
            Mehr über Bee-Impact <ArrowRight size={16} />
          </Link>
        </div>
      </div>
      </div>
    </section>
  );
}
