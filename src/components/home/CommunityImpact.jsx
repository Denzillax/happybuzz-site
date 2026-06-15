"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Leaf, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { getCommunityImpactStats } from "@/lib/listings";

const GREEN = "#5B8C5A";
const DARK = "#191615";
const MUTED = "#757575";
const HEAD = "'General Sans', 'Manrope', system-ui, sans-serif";

const chf = (n) => Math.round(Number(n || 0)).toLocaleString("de-CH");

const PHOTOS = [
  { src: "/images/bee-impact.jpg", alt: "Biene auf einer Blume mit Vintage-Polaroid-Kamera" },
  { src: "/images/bee-impact_GB.jpg", alt: "Biene auf einer Blume mit einem Nintendo Game Boy" },
  { src: "/images/bee-impact_Vinyl.jpg", alt: "Biene auf einer Blume mit einer Vinyl-Schallplatte" },
];

export function CommunityImpact() {
  const [stats, setStats] = useState({ impact: 0, articles: 0 });
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
      const { data: rows } = await supabase.from("fee_ledger").select("bee_impact").eq("seller_id", session.user.id).neq("status", "cancelled");
      if (rows) setUserImpact(rows.reduce((s, r) => s + Number(r.bee_impact || 0), 0));
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
      background: "#fff",
      padding: "44px 20px",
    }}>
      <div className="impact-layout" style={{ maxWidth: 1080, margin: "0 auto" }}>
        {/* ── Foto-Karussell ── */}
        <div className="impact-photo" style={{
          position: "relative", borderRadius: 20, overflow: "hidden",
          background: "#E8EFE6",
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
                  width: i === slide ? 22 : 8, height: 8, padding: 0, borderRadius: 4, border: "none", cursor: "pointer",
                  background: i === slide ? "#fff" : "rgba(255,255,255,.55)", boxShadow: "0 1px 3px rgba(0,0,0,.25)",
                  transition: "width .3s, background .3s",
                }} />
            ))}
          </div>
        </div>

        {/* ── Inhalt ── */}
        <div className="impact-content">
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <Leaf size={15} color={GREEN} />
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: GREEN }}>Bee-Impact</span>
          </div>
          <h2 style={{ margin: "0 0 18px", fontSize: "clamp(26px, 4vw, 34px)", fontWeight: 800, fontFamily: HEAD, color: DARK, letterSpacing: ".01em", lineHeight: 1.1 }}>
            Gemeinsam bewirken
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {cards.map((c) => (
              <div key={c.label} style={{
                background: "#fff", border: "1px solid #E2E2E2", borderRadius: 16,
                padding: "16px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              }}>
                <span style={{ fontFamily: HEAD, fontWeight: 800, color: DARK, lineHeight: 1.1, fontSize: "clamp(18px, 4.4vw, 28px)" }}>{c.value}</span>
                <span style={{ fontSize: "clamp(10px, 2.4vw, 12px)", color: MUTED, fontWeight: 600, textAlign: "center" }}>{c.label}</span>
              </div>
            ))}
          </div>

          {userImpact > 0 && (
            <p style={{ margin: "16px 0 0", fontSize: 13, color: MUTED }}>
              Von dir beigetragen: <b style={{ color: GREEN }}>CHF {Number(userImpact).toLocaleString("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>{firstName ? `. Danke, ${firstName}.` : "."}
            </p>
          )}

          <Link href="/impact" style={{
            display: "inline-flex", alignItems: "center", gap: 7, marginTop: 20,
            padding: "11px 20px", borderRadius: 12, background: GREEN, color: "#fff",
            fontSize: 14, fontWeight: 700, fontFamily: HEAD, textDecoration: "none",
          }}>
            Mehr über Bee-Impact <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
