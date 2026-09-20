"use client";
// Challenge der Woche auf der Startseite: erscheint nur, wenn im Admin eine
// aktive Challenge als "featured" markiert ist. Eingeloggte sehen ihren
// Live-Fortschritt (gleiche Berechnung wie im Hive), Geschaffte den
// Einloese-Link. Ohne featured Challenge rendert die Sektion nichts.
import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { getFeaturedChallenge, getChallengesWithProgress } from "@/lib/gamification";
import BeeIcon from "@/components/shared/BeeIcon";

const INK = "#1D1D1D";
const SAND = "#FBEBEA";
const PAPER = "#FFFFFF";
const HONEY = "#FFE7A9";
const PETROL = "#1D1D1D";
const MONO = "'Instrument Sans', 'Manrope', sans-serif";

function restzeit(endsAt) {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "beendet";
  const tage = Math.floor(diff / 86400000);
  if (tage >= 1) return `noch ${tage} ${tage === 1 ? "Tag" : "Tage"}`;
  const std = Math.max(1, Math.floor(diff / 3600000));
  return `noch ${std} Std`;
}

export function ChallengeBanner() {
  const [challenge, setChallenge] = useState(null);
  const [progress, setProgress] = useState(null); // { progress, done, claimed } | null (ausgeloggt)
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    (async () => {
      const c = await getFeaturedChallenge();
      if (!c) return;
      setChallenge(c);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setLoggedIn(true);
      const withProgress = await getChallengesWithProgress(session.user.id);
      const mine = withProgress.find(x => x.id === c.id);
      if (mine) setProgress(mine);
    })();
  }, []);

  if (!challenge) return null;
  const pct = progress ? Math.round((progress.progress / challenge.target_value) * 100) : 0;
  const isDone = progress?.done;
  const cta = !loggedIn
    ? { href: "/login", label: "Mitmachen" }
    : isDone
      ? { href: "/hive", label: "Im Hive einlösen" }
      : { href: "/listings/new", label: "Jetzt inserieren" };

  return (
    // Durchgehendes Creme-Band: gleiche Flaeche wie Hero und Bee-Impact,
    // symmetrischer Abstand (40px) ober- und unterhalb der Box
    <section className="home-band" style={{ background: PAPER, padding: "40px 24px", marginTop: 48 }}>
      <style>{`
        /* Aufmerksamkeit ohne Kitsch: ein goldener Lichtstreif gleitet alle
           paar Sekunden ueber die Karte, die Bee-Loud-Marke wippt kurz */
        @keyframes chalSheen {
          0% { transform: translateX(-140%) skewX(-18deg); }
          16% { transform: translateX(340%) skewX(-18deg); }
          100% { transform: translateX(340%) skewX(-18deg); }
        }
        .chal-sheen-clip {
          position: absolute; inset: 0; border-radius: 14px;
          overflow: hidden; pointer-events: none;
        }
        .chal-sheen {
          position: absolute; top: 0; bottom: 0; left: 0; width: 34%;
          background: linear-gradient(105deg, rgba(244,192,63,0) 0%, rgba(244,192,63,.22) 50%, rgba(244,192,63,0) 100%);
          animation: chalSheen 5.5s ease-in-out infinite;
        }
        @keyframes chalWiggle {
          0%, 86%, 100% { transform: rotate(-6deg); }
          89% { transform: rotate(-14deg) scale(1.04); }
          92% { transform: rotate(2deg) scale(1.04); }
          95% { transform: rotate(-10deg); }
        }
        .chal-bee {
          width: 190px; height: auto; flex-shrink: 0;
          margin: 0 12px 0 0;
          transform: rotate(-4deg);
          animation: chalWiggle 4.5s ease-in-out infinite;
          position: relative; z-index: 1;
        }
        @media (max-width: 640px) {
          .chal-bee { width: 138px; margin: 0 4px 0 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .chal-sheen, .chal-bee { animation: none !important; }
          .chal-sheen { display: none; }
        }
      `}</style>
      {/* Gleiche Breite wie die Bee-Impact-Box (1080) */}
      <div className="chal-box home-band-box" style={{ position: "relative", maxWidth: 1080, margin: "0 auto", background: "#FFFCF3", border: "1px solid #F0E3BC", borderRadius: 20, boxShadow: 'none', padding: "18px 20px", display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
        {/* Lichtstreif laeuft in einer eigenen, gerundeten Clip-Ebene,
            damit die ueberstehende Biene nicht mitbeschnitten wird */}
        <div className="chal-sheen-clip"><div className="chal-sheen" /></div>
        {/* Bee-Loud-Marke: ragt oben/unten leicht aus der Box (Sticker-Effekt) */}
        <img src="/bee-flach-megafon.svg" alt="" aria-hidden="true" className="chal-bee" />
        <div style={{ flex: 1, minWidth: 220 }}>
          <p style={{ margin: 0, fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: PETROL }}>
            Challenge der Woche
          </p>
          <p style={{ margin: "3px 0 0", fontSize: 17, fontWeight: 800, fontFamily: "'Instrument Sans', 'General Sans', 'Instrument Sans', 'Manrope', sans-serif", color: INK }}>
            {challenge.title}
            {challenge.category?.name && <span style={{ fontWeight: 600, color: "#5B626C" }}> · {challenge.category.name}</span>}
          </p>
          {challenge.description && <p style={{ margin: "2px 0 0", fontSize: 13, color: "#5B626C" }}>{challenge.description}</p>}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 6, flexWrap: "wrap", fontSize: 12.5 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 800, color: PETROL }}>
              <Zap size={13} /> +{challenge.xp_reward} Pollen
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#5B626C" }}>
              <Clock size={13} /> {restzeit(challenge.ends_at)}
            </span>
          </div>
          {progress && (
            <div style={{ marginTop: 8, maxWidth: 340 }}>
              <div style={{ height: 8, background: "#F1F3F5", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: isDone ? "#50804F" : INK, borderRadius: 999, transition: "width .5s" }} />
              </div>
              <p style={{ margin: "3px 0 0", fontSize: 11, color: "#5B626C" }}>
                {isDone ? (progress.claimed ? "Geschafft, Pollen gutgeschrieben." : "Geschafft. Hol dir deine Pollen.") : `${progress.progress} von ${challenge.target_value}`}
              </p>
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "stretch", flexShrink: 0 }}>
          <Link href={cta.href} className="cta-pill" style={{ padding: "11px 22px", background: HONEY, border: "none", borderRadius: 999, color: INK, fontSize: 13.5, fontWeight: 800, textDecoration: "none", textAlign: "center", position: "relative", zIndex: 1 }}>
            {cta.label}
          </Link>
          <Link href="/hive" style={{ fontSize: 11.5, color: PETROL, textDecoration: "underline", textUnderlineOffset: 3, textAlign: "center", display: "inline-flex", alignItems: "center", gap: 5, justifyContent: "center" }}>
            <BeeIcon size={12} /> Alle Challenges
          </Link>
        </div>
      </div>
    </section>
  );
}
