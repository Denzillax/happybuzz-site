"use client";
import { useEffect, useState } from "react";
import { Grid2x2, Grid3x3, LayoutGrid } from "lucide-react";

// Raster-Umschalter (Denis, 15.09.): Inserate pro Zeile waehlen. Die Wahl liegt
// in localStorage und als Klasse am <html>; das Inline-Script in layout.tsx
// setzt sie VOR dem ersten Malen, damit nichts springt.
export const RASTER_KEY = "beedaro_raster";
const STUFEN = [
  { key: "gross",   label: "3 pro Zeile, grosse Bilder", Icon: Grid2x2 },
  { key: "mittel",  label: "4 pro Zeile",                Icon: Grid3x3 },
  { key: "kompakt", label: "6 pro Zeile, kompakt",       Icon: LayoutGrid },
];

export function setzeRaster(stufe) {
  const root = document.documentElement;
  root.classList.remove("raster-gross", "raster-mittel", "raster-kompakt");
  root.classList.add(`raster-${stufe}`);
  try { localStorage.setItem(RASTER_KEY, stufe); } catch {}
  window.dispatchEvent(new CustomEvent("beedaro:raster", { detail: stufe }));
}

export function RasterUmschalter() {
  const [stufe, setStufe] = useState("mittel");
  useEffect(() => {
    try { const v = localStorage.getItem(RASTER_KEY); if (v && STUFEN.some(s => s.key === v)) setStufe(v); } catch {}
    const onChange = (e) => setStufe(e.detail);
    window.addEventListener("beedaro:raster", onChange);
    return () => window.removeEventListener("beedaro:raster", onChange);
  }, []);
  return (
    <div className="raster-umschalter" role="group" aria-label="Inserate pro Zeile">
      {STUFEN.map(({ key, label, Icon }) => (
        <button key={key} type="button" className={key === stufe ? "on" : ""} aria-label={label} title={label} aria-pressed={key === stufe}
          onClick={() => setzeRaster(key)}>
          <Icon size={15} />
        </button>
      ))}
    </div>
  );
}
