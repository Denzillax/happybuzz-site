"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { colors, fonts, radius } from "@/lib/theme";

const K = { ink: "#14110D", petrol: "#0B5E5C" };

export default function OrderTimeline({ events, isFinished, finishedLabel, isBuyer, seller, fmtDate, getEventCategory, getEventDisplay }) {
  const [showFullTimeline, setShowFullTimeline] = useState(false);
  const sortedEvents = [...events].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const visibleEvents = showFullTimeline ? sortedEvents : sortedEvents.slice(0, 2);

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${K.ink}`, padding: 20, marginBottom: 16 }}>
      {isFinished && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#5B8C5A" }} />
          <span style={{ fontSize: 15, fontWeight: 800 }}>{finishedLabel}</span>
        </div>
      )}
      {events.length === 0 && <p style={{ fontSize: 13, color: colors.muted }}>Noch keine Aktivität.</p>}
      {visibleEvents.map((ev, i) => {
        const isLast = i === visibleEvents.length - 1;
        return (
          <div key={ev.id} style={{ display: "flex", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: i === 0 && !isFinished ? colors.yellow : "#5B8C5A", marginTop: 4 }} />
              {!isLast && <div style={{ width: 2, flex: 1, background: colors.borderLt, minHeight: 24 }} />}
            </div>
            <div style={{ paddingBottom: 20, flex: 1 }}>
              <div style={{ fontSize: 12, color: colors.muted }}>{fmtDate(ev.created_at)}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: colors.dark, marginTop: 2 }}>{getEventCategory(ev)}</div>
              <div style={{ fontSize: 13, color: colors.muted, marginTop: 1 }}>{getEventDisplay(ev)}</div>
              {ev.tracking_number && (
                <a href={`https://service.post.ch/ekp-web/ui/entry/search/${ev.tracking_number}?lang=de`} target="_blank" rel="noopener" style={{ fontSize: 12, color: K.petrol, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4 }}>{ev.tracking_number} <ExternalLink size={11} /></a>
              )}
              {ev.event_type === "payment_marked" && isBuyer && seller?.iban && (
                <button onClick={() => document.getElementById("payment-info")?.scrollIntoView({ behavior: "smooth" })} style={{ fontSize: 12, color: K.petrol, fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: fonts.body, marginTop: 4, display: "block" }}>Bankverbindung des Verkäufers</button>
              )}
            </div>
          </div>
        );
      })}
      {sortedEvents.length > 2 && (
        <button onClick={() => setShowFullTimeline(!showFullTimeline)} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, color: K.petrol, fontFamily: fonts.body, padding: "4px 0 0", textTransform: "uppercase", letterSpacing: ".03em" }}>
          {showFullTimeline ? <><ChevronUp size={14} /> Weniger anzeigen</> : <><ChevronDown size={14} /> Siehe Verlauf</>}
        </button>
      )}
    </div>
  );
}
