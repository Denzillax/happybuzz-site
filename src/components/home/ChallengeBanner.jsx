"use client";
// Challenge der Woche auf der Startseite: erscheint nur, wenn im Admin eine
// aktive Challenge als "featured" markiert ist. Eingeloggte sehen ihren
// Live-Fortschritt (gleiche Berechnung wie im Hive), Geschaffte den
// Einloese-Link. Ohne featured Challenge rendert die Sektion nichts.
import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, Clock, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { getFeaturedChallenge, getChallengesWithProgress } from "@/lib/gamification";

const INK = "#1D1D1D";

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

  // Meeko-Design (Denis 20.09.2026): ohne Biene. Eine Butter-Tafel mit Ink-Rand, links die Belohnung als grosse Zahl auf
  // einer weissen Kachel, in der Mitte Titel, Beschreibung, Restzeit und Fortschritt, rechts der dunkle Hauptknopf.
  // Styles: globals.css, Block CHALLENGE MEEKO (ch-*).
  return (
    <section className="ch">
      <div className="ch-tafel">
        <div className="ch-lohn" aria-hidden="true">
          <span className="ch-lohn-zahl">+{challenge.xp_reward}</span>
          <span className="ch-lohn-wort">Pollen</span>
        </div>
        <div className="ch-text">
          <p className="ch-marke">Challenge der Woche</p>
          <h2 className="ch-titel">
            {challenge.title}
            {challenge.category?.name && <span> · {challenge.category.name}</span>}
          </h2>
          {challenge.description && <p className="ch-beschrieb">{challenge.description}</p>}
          <div className="ch-zeile">
            <span><Zap size={14} aria-hidden="true" /> +{challenge.xp_reward} Pollen</span>
            <span><Clock size={14} aria-hidden="true" /> {restzeit(challenge.ends_at)}</span>
          </div>
          {progress && (
            <div className="ch-fortschritt">
              <div className="ch-balken" role="progressbar" aria-valuemin={0} aria-valuemax={challenge.target_value} aria-valuenow={progress.progress}>
                <div style={{ width: `${Math.min(100, pct)}%`, background: isDone ? "#50804F" : INK }} />
              </div>
              <p>{isDone ? (progress.claimed ? "Geschafft, Pollen gutgeschrieben." : "Geschafft. Hol dir deine Pollen.") : `${progress.progress} von ${challenge.target_value}`}</p>
            </div>
          )}
        </div>
        <div className="ch-knoepfe">
          <Link href={cta.href} className="ch-knopf">{cta.label}</Link>
          <Link href="/hive" className="ch-link">Alle Challenges <ArrowRight size={13} aria-hidden="true" /></Link>
        </div>
      </div>
    </section>
  );
}
