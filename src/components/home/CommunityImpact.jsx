"use client";
// Bee-Impact auf der Startseite: was die Community bisher zusammengetragen hat. Meeko-Fassung (24.09.2026): dieselbe
// Karte wie die Challenge der Woche (weiss, Ink-Rand, links ein Feld), damit die beiden Abschnitte als Geschwister lesbar sind.
// Links das Foto der Biene im sanften Grün (Bienenschutz), rechts Titel, die drei Zahlen als Kacheln, das nächste Ziel als
// Balken und der Nebenknopf. Styles: globals.css, Block BEE-IMPACT MEEKO (ci-*).
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Flower2, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { getCommunityImpactStats } from "@/lib/listings";
import { nextMilestone } from "@/lib/impact";

const chf = (n) => Math.round(Number(n || 0)).toLocaleString("de-CH");

const PHOTO = { src: "/images/bee-impact.jpg", alt: "Biene auf einer Blume" };

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
      if (profile) setFirstName((profile.first_name || profile.display_name || "").trim());
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
  const zahlen = [
    { value: Number(stats.articles).toLocaleString("de-CH"), label: "Artikel gerettet" },
    { value: `${co2t.toFixed(1)} t`, label: "CO2 vermieden" },
    { value: `CHF ${chf(stats.impact)}`, label: "an Projekte", akzent: true },
  ];

  const ms = nextMilestone(stats.impact);
  const span = Math.max(1, ms.target - ms.prev);
  const bezahlt = Number(stats.impact || 0);
  const unterwegs = Number(stats.unterwegs || 0);
  const paidPct = Math.max(0, Math.min(100, ((bezahlt - ms.prev) / span) * 100));
  const wegPct = Math.max(0, Math.min(100 - paidPct, (unterwegs / span) * 100));
  const remaining = Math.max(0, ms.target - bezahlt);

  return (
    <section className="ci">
      <div className="ci-tafel">
        <div className="ci-feld">
          <Image src={PHOTO.src} alt={PHOTO.alt} fill sizes="(max-width: 900px) 100vw, 300px" style={{ objectFit: "cover" }} />
          <span className="ci-sticker"><Flower2 size={14} strokeWidth={2.4} aria-hidden="true" /> 20% jeder Gebühr</span>
        </div>

        <div className="ci-text">
          <p className="ci-marke">Bee-Impact</p>
          <h2 className="ci-titel">Was bisher zusammengekommen ist</h2>

          <div className="ci-zahlen">
            {zahlen.map((z) => (
              <div key={z.label} className={z.akzent ? "ci-zahl akzent" : "ci-zahl"}>
                <b>{z.value}</b>
                <i>{z.label}</i>
              </div>
            ))}
          </div>

          <div className="ci-ziel">
            <div className="ci-ziel-kopf">
              <span className="ci-ziel-name">Nächstes Ziel: {ms.name}</span>
              <span className="ci-ziel-stand">CHF {chf(bezahlt)} / {chf(ms.target)}</span>
            </div>
            <div className="ci-balken" role="progressbar" aria-valuemin={ms.prev} aria-valuemax={ms.target} aria-valuenow={Math.min(ms.target, bezahlt)} aria-label={`CHF ${chf(bezahlt)} von ${chf(ms.target)}`}>
              <div className="ci-balken-voll" style={{ width: `${paidPct}%` }} />
              <div className="ci-balken-weg" style={{ width: `${wegPct}%` }} />
            </div>
            <p className="ci-ziel-text">
              {ms.reached
                ? <>Alle Ziele erreicht. <b>CHF {chf(unterwegs)} unterwegs.</b></>
                : <>Noch <b>CHF {chf(remaining)}</b>{unterwegs > 0 ? <>. CHF {chf(unterwegs)} schon unterwegs.</> : "."}</>}
            </p>
          </div>

          {userImpact > 0 && (
            <p className="ci-eigen">
              Von dir beigetragen: <b>CHF {Number(userImpact).toLocaleString("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>{firstName ? `. Danke, ${firstName}.` : "."}
            </p>
          )}

          <Link href="/impact" className="ci-knopf">Mehr über Bee-Impact <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" /></Link>
        </div>
      </div>
    </section>
  );
}
