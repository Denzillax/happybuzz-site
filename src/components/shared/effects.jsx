"use client";
// Effekt-Bausteine (Denis, 18.09.2026). Spec: docs/superpowers/specs/2026-09-18-effekte-design.md
// Alles respektiert prefers-reduced-motion: dann gibt es nur den Endzustand.
import { useEffect, useRef, useState } from "react";

export const wenigBewegung = () =>
  typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Ist das Element im Bild? (einmalig, bleibt danach true)
export function useInView(ref, { once = true, margin = "0px 0px -8% 0px" } = {}) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setInView(true); return; }
    const io = new IntersectionObserver((es) => {
      for (const e of es) {
        if (e.isIntersecting) { setInView(true); if (once) io.disconnect(); }
        else if (!once) setInView(false);
      }
    }, { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, once, margin]);
  return inView;
}

// Zählt weich von der zuletzt gezeigten Zahl auf `value`.
// `aktiv` = false hält den Startwert (z. B. bis das Element sichtbar ist).
export function useCountUp(value, { dauer = 700, aktiv = true, vonNull = false } = {}) {
  const ziel = Number(value) || 0;
  const [zahl, setZahl] = useState(vonNull ? 0 : ziel);
  const von = useRef(vonNull ? 0 : ziel);
  useEffect(() => {
    if (!aktiv) return;
    if (wenigBewegung() || von.current === ziel) { von.current = ziel; setZahl(ziel); return; }
    const start = von.current, t0 = performance.now();
    let raf;
    const schritt = (t) => {
      const p = Math.min(1, (t - t0) / dauer);
      const e = 1 - Math.pow(1 - p, 3);
      const v = start + (ziel - start) * e;
      von.current = v; setZahl(v);
      if (p < 1) raf = requestAnimationFrame(schritt);
      else { von.current = ziel; setZahl(ziel); }
    };
    raf = requestAnimationFrame(schritt);
    return () => cancelAnimationFrame(raf);
  }, [ziel, dauer, aktiv]);
  return zahl;
}

// Zahl, die beim Sichtbarwerden von 0 hochzählt.
export function CountUp({ value, format = (n) => Math.round(n).toLocaleString("de-CH"), dauer = 900 }) {
  const ref = useRef(null);
  const inView = useInView(ref);
  const zahl = useCountUp(value, { dauer, aktiv: inView, vonNull: true });
  return <span ref={ref} style={{ fontVariantNumeric: "tabular-nums" }}>{format(zahl)}</span>;
}

// Betrag, der bei einer Änderung (nicht beim ersten Laden) hochzählt und kurz in Honig blitzt.
export function AnimatedAmount({ value, format }) {
  const zahl = useCountUp(value, { dauer: 600 });
  const erster = useRef(true);
  const [blitz, setBlitz] = useState(0);
  useEffect(() => {
    if (erster.current) { erster.current = false; return; }
    setBlitz((b) => b + 1);
  }, [value]);
  return <span key={blitz} className={blitz ? "bd-fx-flash" : undefined} style={{ fontVariantNumeric: "tabular-nums" }}>{format(zahl)}</span>;
}

// Lässt ein Element minimal zum Mauszeiger ziehen (nur mit Maus, max. `staerke` px).
export function Magnetic({ children, staerke = 6 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || wenigBewegung() || !window.matchMedia || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const move = (e) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      el.style.transform = `translate(${(dx * staerke).toFixed(1)}px, ${(dy * staerke).toFixed(1)}px)`;
    };
    const weg = () => { el.style.transform = ""; };
    el.addEventListener("mousemove", move);
    el.addEventListener("mouseleave", weg);
    return () => { el.removeEventListener("mousemove", move); el.removeEventListener("mouseleave", weg); };
  }, [staerke]);
  return <span ref={ref} className="bd-fx-magnet" style={{ display: "inline-flex" }}>{children}</span>;
}

// Globaler Beobachter: blendet Elemente mit der Klasse bd-fx-reveal gestaffelt ein.
// Die Elemente sind nur versteckt, solange html die Klasse bd-fx-on trägt. Läuft
// kein JavaScript, bleibt alles sichtbar.
export function RevealObserver() {
  useEffect(() => {
    if (wenigBewegung() || typeof IntersectionObserver === "undefined") return;
    const root = document.documentElement;
    root.classList.add("bd-fx-on");
    const io = new IntersectionObserver((es) => {
      let i = 0;
      for (const e of es) {
        if (!e.isIntersecting) continue;
        e.target.style.transitionDelay = `${Math.min(i, 6) * 40}ms`;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
        i++;
      }
    }, { rootMargin: "0px 0px -4% 0px" });
    const erfassen = () => document.querySelectorAll(".bd-fx-reveal:not(.is-in):not([data-fx-obs])").forEach((el) => {
      el.setAttribute("data-fx-obs", "1");
      io.observe(el);
    });
    erfassen();
    let plan = null;
    const mo = new MutationObserver(() => {
      if (plan) return;
      plan = setTimeout(() => { plan = null; erfassen(); }, 80);
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); if (plan) clearTimeout(plan); root.classList.remove("bd-fx-on"); };
  }, []);
  return null;
}
