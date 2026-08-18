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
const PAPER = "#FBF8F2";
const SAND = "#F9F4EC";
const HONEY = "#F4C03F";
const PETROL = "#0B5E5C";
const MUTED = "rgba(20,17,13,0.55)";
const HEAD = "'General Sans', 'Manrope', system-ui, sans-serif";
const MONO = "'Space Mono', ui-monospace, monospace";

const chf = (n) => Math.round(Number(n || 0)).toLocaleString("de-CH");

const PHOTOS = [
  { src: "/images/bee-impact.jpg", alt: "Biene auf einer Blume mit Vintage-Polaroid-Kamera" },
  { src: "/images/bee-impact_GB.jpg", alt: "Biene auf einer Blume mit einem Nintendo Game Boy" },
  { src: "/images/bee-impact_Vinyl.jpg", alt: "Biene auf einer Blume mit einer Vinyl-Schallplatte" },
];

export function CommunityImpact() {
  const [stats, setStats] = useState({ impact: 0, unterwegs: 0, articles: 0 });
  const [userImpact, setUserImpact] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % PHOTOS.length), 4500);
    return () => clearInterval(t);
  }, []);

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
    <section className="home-band" style={{
      width: "100%",
      background: PAPER,
      // oben 0: der Abstand kommt vom Challenge-Band darueber (40px), so ist
      // die Luecke Hero->Challenge->Impact ueberall gleich
      padding: "0 20px 56px",
    }}>
      {/* Ganze Impact-Box mit Katalog-Outline, gleiche Bauart wie die Karten unten */}
      <div className="home-band-box" style={{ maxWidth: 1080, margin: "0 auto", background: "#fff", border: `1.5px solid ${INK}`, padding: "clamp(18px, 3vw, 28px)", position: "relative" }}>
      {/* Kampagnen-Stempel, nur Desktop (Klasse in globals.css) */}
      <img src="/badge-cutting-prices.png" alt="Cutting Prices, Saving Flowers" className="impact-stamp" />
      <div className="impact-layout">
        {/* ── Foto-Karussell ── */}
        <div className="impact-photo" style={{
          position: "relative", borderRadius: 0, overflow: "hidden",
          background: SAND, border: `1.5px solid ${INK}`,
          aspectRatio: "3 / 2",
        }}>
          {PHOTOS.map((p, i) => (
            <Image key={p.src} src={p.src} alt={p.alt} fill priority={i === 0}
              sizes="(max-width: 768px) 100vw, 540px"
              style={{ objectFit: "cover", opacity: i === slide ? 1 : 0, transition: "opacity .8s ease-in-out" }} />
          ))}
          {/* Punkte */}
          <div style={{ position: "absolute", bottom: 12, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 7, zIndex: 2 }}>
            {PHOTOS.map((p, i) => (
              <button key={p.src} onClick={() => setSlide(i)} aria-label={`Bild ${i + 1}`}
                style={{
                  width: i === slide ? 22 : 8, height: 8, padding: 0, borderRadius: 0, border: "none", cursor: "pointer",
                  background: i === slide ? "#fff" : "rgba(255,255,255,.55)", boxShadow: "0 1px 3px rgba(0,0,0,.25)",
                  transition: "width .3s, background .3s",
                }} />
            ))}
          </div>
        </div>

        {/* ── Inhalt ── */}
        <div className="impact-content">
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
            <Leaf size={14} color={MOSS} />
            <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: PETROL }}>Bee-Impact</span>
          </div>
          <h2 style={{ margin: "0 0 20px", fontSize: "clamp(28px, 4.2vw, 40px)", fontWeight: 700, fontFamily: HEAD, color: INK, letterSpacing: "-0.01em", lineHeight: 1.05 }}>
            Gemeinsam bewirken
          </h2>

          <div style={{ display: "flex", border: `1.5px solid ${INK}`, borderRadius: 0, overflow: "hidden", background: "#fff" }}>
            {cards.map((c, i) => (
              <div key={c.label} style={{
                flex: 1, padding: "16px 10px 14px", borderLeft: i ? `1px solid ${INK}1a` : "none",
                display: "flex", flexDirection: "column", gap: 7, minWidth: 0,
              }}>
                <span style={{ fontFamily: MONO, fontSize: "clamp(9px, 2vw, 10.5px)", letterSpacing: ".1em", textTransform: "uppercase", color: MUTED, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.label}</span>
                <span style={{ fontFamily: HEAD, fontWeight: 700, color: INK, lineHeight: 1, fontSize: "clamp(19px, 4.4vw, 28px)", letterSpacing: "-0.01em" }}>{c.value}</span>
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
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${INK}1f` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                  <span style={{ fontFamily: HEAD, fontSize: 13.5, fontWeight: 700, color: INK }}>Nächstes Ziel: {ms.name}</span>
                  <span style={{ fontFamily: MONO, fontSize: 11.5, color: MUTED }}>CHF {chf(stats.impact)} / {chf(ms.target)}</span>
                </div>
                <div style={{ height: 12, borderRadius: 999, background: SAND, marginTop: 10, overflow: "hidden", display: "flex", border: `1px solid ${INK}22` }}>
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
            display: "inline-flex", alignItems: "center", gap: 8, marginTop: 22,
            padding: "12px 22px", borderRadius: 0, background: INK, color: PAPER,
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
