"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getAnnouncement } from "@/lib/announcement";

export function AnnouncementBar() {
  const [a, setA] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    let active = true;
    getAnnouncement().then((row) => {
      if (!active || !row) return;
      const dismissed = typeof window !== "undefined" ? localStorage.getItem("beedaro_ann_dismissed") : null;
      setA(row);
      setShow(!!row.enabled && !!(row.message || "").trim() && dismissed !== row.updated_at);
    });
    return () => { active = false; };
  }, []);

  if (!show || !a) return null;
  const dismiss = () => {
    try { localStorage.setItem("beedaro_ann_dismissed", a.updated_at); } catch {}
    setShow(false);
  };

  const isMarquee = a.effect === "marquee";
  const barClass = a.effect === "slide" ? "ann-slide" : "";

  return (
    <div className={barClass} style={{ background: a.bg_color, color: a.text_color, fontSize: 15, fontWeight: 700, position: "relative", fontFamily: "'Manrope', sans-serif", lineHeight: 1.4, overflow: "hidden" }}>
      {isMarquee ? (
        <div style={{ padding: "11px 0" }}>
          <span className="ann-marquee-track">{a.message}</span>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "11px 36px" }}>
          <span className={a.effect === "pulse" ? "ann-pulse" : ""} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.message}</span>
        </div>
      )}
      <button onClick={dismiss} aria-label="Schliessen" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: a.text_color, cursor: "pointer", opacity: 0.85, display: "inline-flex", padding: 4, zIndex: 1 }}>
        <X size={16} />
      </button>
    </div>
  );
}
