"use client";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Wischbare Startseiten-Reihe (mobil: Flex mit overflow-x). Am Handy wischt
// man mit dem Finger; am Desktop in schmalem Fenster gibt es keine Geste und
// keine sichtbare Scrollleiste (Denis, 16.09.). Darum: Pfeil-Knoepfe (nur bei
// Maus/Trackpad, CSS .swipe-nav) und Ziehen mit gedrueckter Maustaste.
export function SwipeRow({ className = "", children }) {
  const ref = useRef(null);
  const drag = useRef({ x: 0, left: 0, moved: false, active: false });

  const scrollBy = (dir) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.75), behavior: "smooth" });
  };

  const onPointerDown = (e) => {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    drag.current = { x: e.clientX, left: el.scrollLeft, moved: false, active: true };
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d.active) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 5) d.moved = true;
    if (d.moved) { ref.current.scrollLeft = d.left - dx; e.preventDefault(); }
  };
  const onPointerUp = () => { drag.current.active = false; };
  // Nach einem Zieh-Vorgang darf der Klick nicht das Inserat oeffnen
  const onClickCapture = (e) => {
    if (drag.current.moved) { e.preventDefault(); e.stopPropagation(); drag.current.moved = false; }
  };

  return (
    <div className="swipe-wrap" style={{ position: "relative" }}>
      <div
        ref={ref}
        className={className}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onClickCapture={onClickCapture}
      >
        {children}
      </div>
      <button type="button" className="swipe-nav swipe-prev" aria-label="Zurück" onClick={() => scrollBy(-1)}><ChevronLeft size={18} /></button>
      <button type="button" className="swipe-nav swipe-next" aria-label="Weiter" onClick={() => scrollBy(1)}><ChevronRight size={18} /></button>
    </div>
  );
}
