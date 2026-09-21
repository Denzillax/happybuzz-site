"use client";
// Challenge der Woche auf der Startseite: erscheint nur, wenn im Admin eine
// aktive Challenge als "featured" markiert ist. Eingeloggte sehen ihren
// Live-Fortschritt (gleiche Berechnung wie im Hive), Geschaffte den
// Einloese-Link. Ohne featured Challenge rendert die Sektion nichts.
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
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

  // Vierte Fassung (Denis 21.09.2026): weisse Karte mit Mint-Feld und Biene, so ähnlich wie im alten Design. Styles: globals.css, CHALLENGE MEEKO (ch-*).
  const ziel = Math.max(1, challenge.target_value || 1);
  const stand = Math.min(ziel, progress?.progress || 0);
  const alsKacheln = ziel <= 24;
  return (
    <section className="ch">
      <div className="ch-tafel">
        {/* Mint-Feld mit der Foto-Biene und dem Belohnungs-Aufkleber, wie das Honig-Feld im alten Design */}
        <div className="ch-feld" aria-hidden="true">
          <span className="ch-sticker"><b>+{challenge.xp_reward}</b> Pollen</span>
          <img className="ch-biene" src="/bee-megafon-foto.webp" alt="" width="1254" height="1254" loading="lazy" decoding="async" />
        </div>
        <div className="ch-text">
          <p className="ch-marke">Challenge der Woche</p>
          <h2 className="ch-titel">
            {challenge.title}
            {challenge.category?.name && <span> · {challenge.category.name}</span>}
          </h2>
          {challenge.description && <p className="ch-beschrieb">{challenge.description}</p>}
          <div className="ch-stand">
            {alsKacheln ? (
              <div className="ch-kacheln" role="progressbar" aria-valuemin={0} aria-valuemax={ziel} aria-valuenow={stand} aria-label={`${stand} von ${ziel}`}>
                {Array.from({ length: ziel }).map((_, i) => <span key={i} className={i < stand ? (isDone ? "voll fertig" : "voll") : undefined} />)}
              </div>
            ) : (
              <div className="ch-balken" role="progressbar" aria-valuemin={0} aria-valuemax={ziel} aria-valuenow={stand}><div style={{ width: `${Math.min(100, pct)}%` }} /></div>
            )}
            <p>
              {!loggedIn ? `${ziel} Schritte bis zur Belohnung. Melde dich an, dann zählt jeder mit.`
                : isDone ? (progress.claimed ? "Geschafft, Pollen gutgeschrieben." : "Geschafft. Hol dir deine Pollen.")
                : `${stand} von ${ziel} geschafft`}
            </p>
          </div>
        </div>
        <div className="ch-seite">
          <Uhr ende={challenge.ends_at} />
          <Link href={cta.href} className="ch-knopf">{cta.label} <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" /></Link>
          <Link href="/hive" className="ch-link">Alle Challenges</Link>
        </div>
      </div>
    </section>
  );
}

// Restzeit, die sekundengenau herunterzählt. Über einem Tag: Tage, Stunden, Minuten. Darunter: Stunden, Minuten, Sekunden.
function Uhr({ ende }) {
  const [jetzt, setJetzt] = useState(null);
  useEffect(() => { setJetzt(Date.now()); const t = setInterval(() => setJetzt(Date.now()), 1000); return () => clearInterval(t); }, []);
  if (jetzt === null) return <div className="ch-uhr" aria-hidden="true" />;
  const sek = Math.max(0, Math.floor((new Date(ende).getTime() - jetzt) / 1000));
  const tage = Math.floor(sek / 86400), std = Math.floor((sek % 86400) / 3600), min = Math.floor((sek % 3600) / 60), s = sek % 60;
  const teile = tage > 0 ? [[tage, "Tage"], [std, "Std"], [min, "Min"]] : [[std, "Std"], [min, "Min"], [s, "Sek"]];
  return (
    <div className="ch-uhr" role="timer" aria-label={sek === 0 ? "beendet" : `endet in ${teile.map(([z, w]) => `${z} ${w}`).join(" ")}`}>
      <span className="ch-uhr-wort">{sek === 0 ? "Beendet" : "Endet in"}</span>
      <div className="ch-uhr-reihe">
        {teile.map(([z, w]) => (
          <span key={w} className="ch-ziffer"><b>{String(z).padStart(2, "0")}</b><i>{w}</i></span>
        ))}
      </div>
    </div>
  );
}
