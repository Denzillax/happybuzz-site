"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Leaf, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { getCommunityImpactStats } from "@/lib/listings";
import { nextMilestone } from "@/lib/impact";

const MOSS = "#487848"; // auf der hellgrünen Box (#EEF3EC) braucht es die dunklere Stufe: #50804F läge bei 4.1, das hier bei 4.6

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

  // Neu gestaltet (Denis 21.09.2026), gleiche Sprache wie die Challenge der Woche: eine weisse Karte mit feinem Rand. Links
  // das Foto über die ganze Höhe mit dem Bee-Impact-Aufkleber, rechts die drei Zahlen als Kacheln (der Betrag an Projekte
  // grün hervorgehoben), darunter das nächste Ziel mit kräftigerem Balken und ein dunkler Knopf.
  // Im style-Block stehen bewusst keine Kind-Selektoren und keine Anführungszeichen (Hydration).
  const ms = nextMilestone(stats.impact);
  const span = Math.max(1, ms.target - ms.prev);
  const paidPct = Math.max(0, Math.min(100, ((Number(stats.impact || 0) - ms.prev) / span) * 100));
  const wegPct = Math.max(0, Math.min(100 - paidPct, (Number(stats.unterwegs || 0) / span) * 100));
  const remaining = Math.max(0, ms.target - Number(stats.impact || 0));
  return (
    <section className="home-band" style={{ padding: "48px 24px 0" }}>
      <style>{`
        .ciw { display: flex; align-items: stretch; background: #fff; border: 1px solid #E5E8EC; border-radius: 18px; box-shadow: 0 10px 30px rgba(25,22,21,.07); overflow: hidden; }
        .ciw-foto { position: relative; flex: 0 0 320px; min-height: 300px; background: #EEF3EC; }
        .ciw-marke { position: absolute; left: 14px; top: 14px; z-index: 2; display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px 8px; border-radius: 10px; background: #2F5A2F; color: #fff; font-size: 11px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; transform: rotate(-4deg); box-shadow: 0 6px 14px rgba(25,22,21,.22); }
        .ciw-inhalt { flex: 1; min-width: 0; padding: 30px 32px; }
        .ciw-auge { margin: 0; font-size: 10.5px; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; color: #487848; }
        .ciw-titel { margin: 6px 0 0; font-size: 26px; font-weight: 800; letter-spacing: -.02em; line-height: 1.15; color: #191615; }
        .ciw-zahlen { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 20px; }
        .ciw-zahl { display: flex; flex-direction: column; gap: 5px; padding: 14px 14px 12px; border-radius: 12px; background: #F5F6F8; border: 1px solid #E5E8EC; min-width: 0; }
        .ciw-zahl b { font-size: clamp(19px, 2.4vw, 27px); font-weight: 800; letter-spacing: -.02em; line-height: 1; color: #191615; font-variant-numeric: tabular-nums; white-space: nowrap; }
        .ciw-zahl em { font-style: normal; font-size: 10px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: #5B626C; }
        .ciw-zahl.gruen { background: #EEF3EC; border-color: #D5E2D2; }
        .ciw-zahl.gruen b { color: #2F5A2F; }
        .ciw-ziel { margin-top: 22px; }
        .ciw-ziel-kopf { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; flex-wrap: wrap; }
        .ciw-ziel-kopf b { font-size: 14.5px; font-weight: 800; color: #191615; }
        .ciw-ziel-kopf span { font-size: 12px; color: #5B626C; font-variant-numeric: tabular-nums; }
        .ciw-balken { display: flex; height: 14px; margin-top: 10px; border-radius: 999px; background: #F1F3F5; border: 1px solid #E5E8EC; overflow: hidden; }
        .ciw-text { margin: 9px 0 0; font-size: 13px; color: #5B626C; }
        .ciw-fuss { display: flex; align-items: center; justify-content: space-between; gap: 14px 20px; flex-wrap: wrap; margin-top: 22px; }
        .ciw-knopf { display: inline-flex; align-items: center; gap: 8px; padding: 13px 22px; border-radius: 999px; background: #191615; color: #fff; font-size: 14px; font-weight: 800; text-decoration: none; }
        @media (max-width: 860px) {
          .ciw { flex-direction: column; }
          .ciw-foto { flex: 0 0 auto; min-height: 0; aspect-ratio: 16 / 9; }
          .ciw-inhalt { padding: 24px 20px 24px; }
          .ciw-titel { font-size: 22px; }
          .ciw-zahl { padding: 12px 10px 10px; }
        }
      `}</style>
      <div className="ciw home-band-box" style={{ maxWidth: 1080, margin: "0 auto" }}>
        <div className="ciw-foto">
          <span className="ciw-marke"><Leaf size={13} /> Bee-Impact</span>
          <Image src={PHOTO.src} alt={PHOTO.alt} fill sizes="(max-width: 860px) 100vw, 320px" style={{ objectFit: "cover" }} />
        </div>
        <div className="ciw-inhalt">
          <p className="ciw-auge">20 % jeder Gebühr</p>
          <h2 className="ciw-titel">Was bisher zusammengekommen ist</h2>

          <div className="ciw-zahlen">
            {cards.map((c, i) => (
              <div key={c.label} className={i === 2 ? "ciw-zahl gruen" : "ciw-zahl"}>
                <b>{c.value}</b>
                <em>{c.label}</em>
              </div>
            ))}
          </div>

          <div className="ciw-ziel">
            <div className="ciw-ziel-kopf">
              <b>Nächstes Ziel: {ms.name}</b>
              <span>CHF {chf(stats.impact)} von {chf(ms.target)}</span>
            </div>
            <div className="ciw-balken" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(paidPct)}>
              <div style={{ width: `${paidPct}%`, background: MOSS }} />
              <div style={{ width: `${wegPct}%`, background: "repeating-linear-gradient(45deg,#F4C03F,#F4C03F 5px,#F7E3A8 5px,#F7E3A8 10px)" }} />
            </div>
            <p className="ciw-text">
              {ms.reached
                ? <>Alle Ziele erreicht. <b style={{ color: "#854F0B" }}>CHF {chf(stats.unterwegs)} unterwegs.</b></>
                : <>Noch <b style={{ color: MOSS }}>CHF {chf(remaining)}</b>{Number(stats.unterwegs || 0) > 0 ? <>. <b style={{ color: "#854F0B" }}>CHF {chf(stats.unterwegs)} schon unterwegs.</b></> : "."}</>}
            </p>
          </div>

          <div className="ciw-fuss">
            <Link href="/impact" className="ciw-knopf bd-btn">Mehr über Bee-Impact <ArrowRight size={16} /></Link>
            {userImpact > 0 && (
              <p style={{ margin: 0, fontSize: 13, color: "#5B626C" }}>
                Von dir beigetragen: <b style={{ color: MOSS }}>CHF {Number(userImpact).toLocaleString("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>{firstName ? `. Danke, ${firstName}.` : "."}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
