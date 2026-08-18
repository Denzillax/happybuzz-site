"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Droplets, ChevronDown, Gift, Flower2 } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import BeeIcon from "@/components/shared/BeeIcon";
import { calculateLevel, levelProgress, xpToNext, BEE_LEVELS } from "@/lib/gamification";

export default function NektarBadge() {
  const [data, setData] = useState(null); // { xp, nektar }
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setData(null); return; }
    const { data: p } = await supabase.from("profiles").select("xp_total, nektar, blueten").eq("id", user.id).maybeSingle();
    if (p) setData({ xp: p.xp_total || 0, nektar: p.nektar || 0, blueten: p.blueten || 0 });
  };

  useEffect(() => {
    load();
    const onChange = () => load();
    window.addEventListener("focus", onChange);
    window.addEventListener("beedaro:nektar", onChange);
    return () => { window.removeEventListener("focus", onChange); window.removeEventListener("beedaro:nektar", onChange); };
  }, []);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  if (!data) return null;
  const level = calculateLevel(data.xp);
  const idx = BEE_LEVELS.indexOf(level);
  const next = BEE_LEVELS[idx + 1] || null;
  const progress = Math.round(levelProgress(data.xp) * 100);
  const toNext = xpToNext(data.xp);

  return (
    <div ref={ref} className="nektar-badge" style={{ position: "relative" }}>
      <button onClick={() => setOpen((o) => !o)} style={{
        display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 0,
        border: "1px solid #14110D", background: "#fff", cursor: "pointer", fontFamily: "'Manrope', sans-serif",
      }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 800, color: level.color, whiteSpace: "nowrap" }}>
          <BeeIcon size={13} color={level.color} /> <span className="nektar-level-name">{level.name}</span>
        </span>
        <span className="nektar-level-name" style={{ width: 1, height: 14, background: "#E2E2E2" }} />
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 800, color: "#C8860A" }}>
          <Droplets size={12} color="#C8860A" /> {data.nektar}
        </span>
        <ChevronDown size={13} color="#9E9E9E" />
      </button>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 200, width: 264, background: "#fff", borderRadius: 0, boxShadow: "0 16px 38px rgba(20,17,13,.16)", border: "1px solid #14110D", padding: 16, fontFamily: "'Manrope', sans-serif" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${level.color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <BeeIcon size={19} color={level.color} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#191615" }}>{level.name}</p>
              <p style={{ margin: 0, fontSize: 11, color: "#757575" }}>{data.xp.toLocaleString("de-CH")} Pollen</p>
            </div>
          </div>
          {/* heller Track braucht eine Kontur, sonst verschwindet er auf Weiss */}
          <div style={{ height: 8, borderRadius: 0, background: "#F9F4EC", border: "1px solid rgba(20,17,13,.2)", overflow: "hidden", marginBottom: 6 }}>
            <div style={{ height: "100%", borderRadius: 0, background: level.color, width: `${next ? progress : 100}%`, transition: "width .4s" }} />
          </div>
          <p style={{ margin: "0 0 12px", fontSize: 11, color: "#757575" }}>
            {next ? `Noch ${toNext.toLocaleString("de-CH")} Pollen bis ${next.name}` : "Maximales Level erreicht"}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 0, background: "#5B8C5A14", border: "1px solid #5B8C5A33", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: "#757575", fontWeight: 600 }}>Blüten</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 15, fontWeight: 900, color: "#5B8C5A" }}><Flower2 size={14} color="#5B8C5A" /> {data.blueten.toLocaleString("de-CH")}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 0, background: "#E8A82014", border: "1px solid #E8A82033", marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: "#757575", fontWeight: 600 }}>Nektar</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 15, fontWeight: 900, color: "#C8860A" }}><Droplets size={14} color="#C8860A" /> {data.nektar}</span>
          </div>
          <Link href="/hive" onClick={() => setOpen(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", borderRadius: 0, background: "#0E9493", color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
            <Gift size={15} /> Belohnungen ansehen
          </Link>
        </div>
      )}
    </div>
  );
}
