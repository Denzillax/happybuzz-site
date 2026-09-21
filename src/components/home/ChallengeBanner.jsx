"use client";
// Challenge der Woche auf der Startseite: erscheint nur, wenn im Admin eine
// aktive Challenge als "featured" markiert ist. Eingeloggte sehen ihren
// Live-Fortschritt (gleiche Berechnung wie im Hive), Geschaffte den
// Einloese-Link. Ohne featured Challenge rendert die Sektion nichts.
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/supabase";
import { getFeaturedChallenge, getChallengesWithProgress } from "@/lib/gamification";
import BeeIcon from "@/components/shared/BeeIcon";

const INK = "#191615";
const SAND = "#F5F6F8";
const PAPER = "#FFFFFF";
const HONEY = "#F4C03F";
const PETROL = "#0B5E5C";
const MONO = "'Manrope', sans-serif";

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

  // Neu gestaltet (Denis 21.09.2026). Zwei Teile in einer Karte: links ein Honig-Feld, aus dem die Biene mit dem Megafon
  // herausragt, mit der Belohnung als dunklem Aufkleber. Rechts der Inhalt: Titel, Fortschritt als Waben-Reihe (ein Feld
  // pro Schritt) und eine Restzeit, die sekundengenau herunterzählt. Der Knopf ist dunkel, damit er neben dem Honig-Feld
  // nicht untergeht. Im style-Block stehen bewusst keine Kind-Selektoren und keine Anführungszeichen (Hydration).
  const ziel = Math.max(1, challenge.target_value || 1);
  const stand = Math.min(ziel, progress?.progress || 0);
  const alsFelder = ziel <= 20;
  return (
    <section className="home-band" style={{ background: PAPER, padding: "56px 24px 40px", marginTop: 48 }}>
      <style>{`
        .chw { position: relative; max-width: 1080px; margin: 0 auto; display: flex; align-items: stretch; background: #fff; border: 1px solid #E5E8EC; border-radius: 18px; box-shadow: 0 10px 30px rgba(25,22,21,.07); }
        .chw-feld { position: relative; flex: 0 0 250px; border-radius: 17px 0 0 17px; background: #F4C03F; min-height: 210px; }
        .chw-bee { position: absolute; left: -6px; bottom: -4px; width: 270px; height: auto; max-width: none; transform-origin: 40% 60%; transform: rotate(-4deg); animation: chwWiggle 5s ease-in-out infinite; filter: drop-shadow(0 8px 10px rgba(25,22,21,.18)); }
        @keyframes chwWiggle { 0%, 84%, 100% { transform: rotate(-4deg); } 88% { transform: rotate(-11deg) scale(1.04); } 92% { transform: rotate(2deg) scale(1.04); } 96% { transform: rotate(-7deg); } }
        .chw-lohn { position: absolute; left: 14px; top: -16px; z-index: 2; display: inline-flex; align-items: baseline; gap: 5px; padding: 7px 13px 8px; border-radius: 10px; background: #191615; color: #fff; font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; transform: rotate(-5deg); box-shadow: 0 6px 14px rgba(25,22,21,.22); }
        .chw-lohn b { font-size: 20px; font-weight: 800; letter-spacing: -.02em; color: #F4C03F; }
        .chw-inhalt { flex: 1; min-width: 0; padding: 26px 28px 26px 52px; display: flex; flex-direction: column; justify-content: center; }
        .chw-marke { margin: 0; font-size: 10.5px; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; color: #0B5E5C; }
        .chw-titel { margin: 6px 0 0; font-size: 26px; font-weight: 800; letter-spacing: -.02em; line-height: 1.15; color: #191615; }
        .chw-titel span { font-weight: 600; color: #5B626C; }
        .chw-text { margin: 5px 0 0; font-size: 14.5px; line-height: 1.45; color: #5B626C; }
        .chw-felder { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 16px; }
        .chw-felder i { width: 22px; height: 22px; border-radius: 6px; background: #F1F3F5; border: 1px solid #E5E8EC; }
        .chw-felder i.voll { background: #F4C03F; border-color: #E0AC2B; }
        .chw-felder i.fertig { background: #50804F; border-color: #50804F; }
        .chw-balken { margin-top: 16px; max-width: 360px; height: 10px; border-radius: 999px; background: #F1F3F5; overflow: hidden; }
        .chw-balken div { height: 100%; border-radius: 999px; background: #F4C03F; transition: width .5s ease; }
        .chw-stand { margin: 7px 0 0; font-size: 12.5px; color: #5B626C; }
        .chw-seite { flex: 0 0 auto; display: flex; flex-direction: column; justify-content: center; gap: 12px; padding: 26px 28px 26px 0; min-width: 236px; }
        .chw-uhr-wort { display: block; margin-bottom: 6px; font-size: 10.5px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: #5B626C; }
        .chw-uhr-reihe { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
        .chw-ziffer { display: flex; flex-direction: column; align-items: center; padding: 9px 4px 7px; border-radius: 10px; background: #F5F6F8; border: 1px solid #E5E8EC; }
        .chw-ziffer b { font-size: 25px; font-weight: 800; letter-spacing: -.02em; line-height: 1; color: #191615; font-variant-numeric: tabular-nums; }
        .chw-ziffer em { font-style: normal; margin-top: 3px; font-size: 9.5px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: #5B626C; }
        .chw-knopf { display: block; padding: 13px 22px; border-radius: 999px; background: #191615; color: #fff; font-size: 14px; font-weight: 800; text-align: center; text-decoration: none; }
        .chw-link { display: inline-flex; align-items: center; justify-content: center; gap: 5px; font-size: 12px; color: #0B5E5C; text-decoration: underline; text-underline-offset: 3px; }
        @media (max-width: 860px) {
          .chw { flex-direction: column; }
          .chw-feld { flex: 0 0 auto; min-height: 150px; border-radius: 17px 17px 0 0; }
          .chw-bee { left: 50%; margin-left: -110px; width: 220px; bottom: -14px; }
          .chw-inhalt { padding: 28px 20px 8px; }
          .chw-titel { font-size: 22px; }
          .chw-seite { padding: 14px 20px 22px; min-width: 0; }
        }
        @media (prefers-reduced-motion: reduce) { .chw-bee { animation: none; } }
      `}</style>
      <div className="chw home-band-box">
        <div className="chw-feld">
          <span className="chw-lohn" aria-hidden="true"><b>+{challenge.xp_reward}</b> Pollen</span>
          <img src="/bee-megafon-foto.webp" alt="" aria-hidden="true" className="chw-bee" width="1254" height="1254" loading="lazy" decoding="async" />
        </div>
        <div className="chw-inhalt">
          <p className="chw-marke">Challenge der Woche</p>
          <h2 className="chw-titel">
            {challenge.title}
            {challenge.category?.name && <span> · {challenge.category.name}</span>}
          </h2>
          {challenge.description && <p className="chw-text">{challenge.description}</p>}
          {alsFelder ? (
            <div className="chw-felder" role="progressbar" aria-valuemin={0} aria-valuemax={ziel} aria-valuenow={stand} aria-label={`${stand} von ${ziel}`}>
              {Array.from({ length: ziel }).map((_, i) => <i key={i} className={i < stand ? (isDone ? "voll fertig" : "voll") : undefined} />)}
            </div>
          ) : (
            <div className="chw-balken" role="progressbar" aria-valuemin={0} aria-valuemax={ziel} aria-valuenow={stand}><div style={{ width: `${Math.min(100, pct)}%` }} /></div>
          )}
          <p className="chw-stand">
            {!loggedIn ? `${ziel} Schritte bis zu ${challenge.xp_reward} Pollen. Melde dich an, dann zählt jeder mit.`
              : isDone ? (progress.claimed ? "Geschafft, Pollen gutgeschrieben." : "Geschafft. Hol dir deine Pollen.")
              : `${stand} von ${ziel} geschafft`}
          </p>
        </div>
        <div className="chw-seite">
          <Uhr ende={challenge.ends_at} />
          <Link href={cta.href} className="chw-knopf cta-pill">{cta.label}</Link>
          <Link href="/hive" className="chw-link"><BeeIcon size={12} /> Alle Challenges</Link>
        </div>
      </div>
    </section>
  );
}

// Restzeit, die sekundengenau herunterzählt. Über einem Tag: Tage, Stunden, Minuten. Darunter: Stunden, Minuten, Sekunden.
function Uhr({ ende }) {
  const [jetzt, setJetzt] = useState(null);
  useEffect(() => { setJetzt(Date.now()); const t = setInterval(() => setJetzt(Date.now()), 1000); return () => clearInterval(t); }, []);
  if (jetzt === null) return <div style={{ minHeight: 74 }} aria-hidden="true" />;
  const sek = Math.max(0, Math.floor((new Date(ende).getTime() - jetzt) / 1000));
  const tage = Math.floor(sek / 86400), std = Math.floor((sek % 86400) / 3600), min = Math.floor((sek % 3600) / 60), s = sek % 60;
  const teile = tage > 0 ? [[tage, "Tage"], [std, "Std"], [min, "Min"]] : [[std, "Std"], [min, "Min"], [s, "Sek"]];
  return (
    <div role="timer" aria-label={sek === 0 ? "beendet" : `endet in ${teile.map(([z, w]) => `${z} ${w}`).join(" ")}`}>
      <span className="chw-uhr-wort">{sek === 0 ? "Beendet" : "Endet in"}</span>
      <div className="chw-uhr-reihe">
        {teile.map(([z, w]) => <span key={w} className="chw-ziffer"><b>{String(z).padStart(2, "0")}</b><em>{w}</em></span>)}
      </div>
    </div>
  );
}
