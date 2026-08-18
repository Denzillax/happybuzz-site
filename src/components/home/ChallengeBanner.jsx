"use client";
// Challenge der Woche auf der Startseite: erscheint nur, wenn im Admin eine
// aktive Challenge als "featured" markiert ist. Eingeloggte sehen ihren
// Live-Fortschritt (gleiche Berechnung wie im Hive), Geschaffte den
// Einloese-Link. Ohne featured Challenge rendert die Sektion nichts.
import { useState, useEffect } from "react";
import Link from "next/link";
import { Target, Zap, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { getFeaturedChallenge, getChallengesWithProgress } from "@/lib/gamification";
import BeeIcon from "@/components/shared/BeeIcon";

const INK = "#14110D";
const SAND = "#F9F4EC";
const PAPER = "#FBF8F2";
const HONEY = "#F4C03F";
const PETROL = "#0B5E5C";
const MONO = "'Space Mono', ui-monospace, monospace";

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
    <section className="home-band" style={{ background: PAPER, padding: "40px 20px" }}>
      <style>{`
        /* Aufmerksamkeit ohne Kitsch: der Honig-Schatten atmet, das Ziel-Icon
           wippt kurz alle paar Sekunden */
        @keyframes chalShadow {
          0%, 100% { box-shadow: 4px 4px 0 ${HONEY}; }
          50% { box-shadow: 8px 8px 0 ${HONEY}; }
        }
        @keyframes chalWiggle {
          0%, 88%, 100% { transform: rotate(0deg); }
          91% { transform: rotate(-9deg); }
          94% { transform: rotate(8deg); }
          97% { transform: rotate(-5deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .chal-box, .chal-icon { animation: none !important; }
        }
      `}</style>
      {/* Gleiche Breite wie die Bee-Impact-Box (1080) */}
      <div className="chal-box home-band-box" style={{ maxWidth: 1080, margin: "0 auto", background: "#fff", border: `1px solid ${INK}`, boxShadow: `4px 4px 0 ${HONEY}`, padding: "18px 20px", display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap", animation: "chalShadow 2.6s ease-in-out infinite" }}>
        <div className="chal-icon" style={{ width: 46, height: 46, flexShrink: 0, background: HONEY, border: `1px solid ${INK}`, display: "flex", alignItems: "center", justifyContent: "center", animation: "chalWiggle 4s ease-in-out infinite" }}>
          <Target size={22} color={INK} />
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <p style={{ margin: 0, fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase", color: PETROL }}>
            Challenge der Woche
          </p>
          <p style={{ margin: "3px 0 0", fontSize: 17, fontWeight: 800, fontFamily: "'General Sans', 'Manrope', sans-serif", color: INK }}>
            {challenge.title}
            {challenge.category?.name && <span style={{ fontWeight: 600, color: "#6b6560" }}> · {challenge.category.name}</span>}
          </p>
          {challenge.description && <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6b6560" }}>{challenge.description}</p>}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 6, flexWrap: "wrap", fontSize: 12.5 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 800, color: PETROL }}>
              <Zap size={13} /> +{challenge.xp_reward} Pollen
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#6b6560" }}>
              <Clock size={13} /> {restzeit(challenge.ends_at)}
            </span>
          </div>
          {progress && (
            <div style={{ marginTop: 8, maxWidth: 340 }}>
              <div style={{ height: 8, background: SAND, border: `1px solid ${INK}`, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: isDone ? "#5B8C5A" : HONEY, transition: "width .5s" }} />
              </div>
              <p style={{ margin: "3px 0 0", fontSize: 11, color: "#6b6560" }}>
                {isDone ? (progress.claimed ? "Geschafft, Pollen gutgeschrieben." : "Geschafft. Hol dir deine Pollen.") : `${progress.progress} von ${challenge.target_value}`}
              </p>
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "stretch", flexShrink: 0 }}>
          <Link href={cta.href} style={{ padding: "11px 22px", background: HONEY, border: `1.5px solid ${INK}`, boxShadow: `2px 2px 0 ${INK}`, color: INK, fontSize: 13.5, fontWeight: 800, textDecoration: "none", textAlign: "center" }}>
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
