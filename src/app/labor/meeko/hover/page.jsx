"use client";
// Karten-Hover zum Vergleichen (Denis 20.09.2026: "die Karten sollen sich anders erheben, mach ein paar Vorschläge").
// Sechs echte Inserate, jedes mit einer anderen Hover-Art. Die Karte selbst ist die echte ListingCard.
// Styles: globals.css, Block HOVER-LABOR (hv-*). Variante 5 braucht die Mausposition, die setzt diese Seite als --rx/--ry.
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/supabase";
import { ListingCard } from "@/components/shared/ListingCard";

const VARIANTEN = [
  ["1", "Schweben", "Steigt gerade hoch, weicher Schatten darunter. Der jetzige Stand."],
  ["2", "Sockel", "Steigt hoch und lässt einen Sockel in der Formatfarbe stehen, mit Ink-Rand. Kein weicher Schatten."],
  ["3", "Federn", "Springt mit Schwung hoch und pendelt kurz nach, leicht gedreht."],
  ["4", "Wachsen", "Wird grösser und schiebt sich vor die Nachbarn. Kein Schatten, keine Verschiebung."],
  ["5", "Kippen", "Neigt sich räumlich zur Maus hin, wie eine Karte in der Hand."],
  ["6", "Aufklappen", "Steigt hoch, die Farbtafel wird grösser und das Foto rückt nach oben heraus."],
];

export default function Page() {
  const [liste, setListe] = useState([]);
  useEffect(() => {
    const jetzt = new Date().toISOString();
    supabase.from("listings")
      .select("id, title, listing_type, price, start_price, buy_now_price, rent_price, rent_period, city, created_at, auction_end, expires_at, bid_count, view_count, is_negotiable, condition, shipping_available, pickup_only, free_shipping, status, user_id, listing_images(url, sort_order)")
      .eq("status", "active").or(`expires_at.is.null,expires_at.gt.${jetzt}`).order("created_at", { ascending: false }).limit(12)
      .then(({ data }) => setListe((data || []).filter((l) => l.listing_images?.length).slice(0, 6)));
  }, []);

  // Variante 5: Mausposition über der Karte als Neigung in Grad
  const neigen = (e) => {
    const el = e.currentTarget, r = el.getBoundingClientRect();
    el.style.setProperty("--ry", `${(((e.clientX - r.left) / r.width) - 0.5) * 14}deg`);
    el.style.setProperty("--rx", `${(0.5 - ((e.clientY - r.top) / r.height)) * 10}deg`);
  };
  const gerade = (e) => { e.currentTarget.style.setProperty("--ry", "0deg"); e.currentTarget.style.setProperty("--rx", "0deg"); };

  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 24px 140px", fontFamily: "'Instrument Sans', sans-serif", color: "#1D1D1D" }}>
      <h1 style={{ fontSize: 34, fontWeight: 500, letterSpacing: "-.04em", margin: "0 0 6px" }}>Karten-Hover: sechs Vorschläge</h1>
      <p style={{ opacity: .7, margin: "0 0 36px", maxWidth: "46em" }}>Fahr mit der Maus über jede Karte. Bei allen löst sich zusätzlich das Foto leicht von der Tafel, wie bisher. Sag mir die Nummer.</p>
      <div className="hv-raster">
        {VARIANTEN.map(([nr, name, text], i) => (
          <div key={nr} className="hv-feld">
            <div className={`hv hv-${nr}`} onMouseMove={nr === "5" ? neigen : undefined} onMouseLeave={nr === "5" ? gerade : undefined}>
              {liste[i] ? <ListingCard listing={liste[i]} /> : <div style={{ aspectRatio: "3/4", border: "1px dashed #1D1D1D", borderRadius: 20 }} />}
            </div>
            <p className="hv-name"><b>{nr}</b> {name}</p>
            <p className="hv-text">{text}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
