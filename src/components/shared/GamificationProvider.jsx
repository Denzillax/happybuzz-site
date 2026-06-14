"use client";
import { useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import { Zap, Trophy, Droplets } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import BeeIcon from "@/components/shared/BeeIcon";
import { calculateLevel, ACHIEVEMENTS, nektarReasonLabel } from "@/lib/gamification";

const REASON_LABEL = {
  listing_created: "Inserat erstellt",
  listing_published: "Inserat veröffentlicht",
  sale_completed: "Verkauf abgeschlossen",
  rental_completed: "Vermietung abgeschlossen",
  purchase_completed: "Kauf abgeschlossen",
  rating_given: "Bewertung abgegeben",
  rating_received_positive: "Gute Bewertung erhalten",
  daily_streak: "Täglicher Streak",
};
const reasonLabel = (r) => REASON_LABEL[r] || "Aktion";

function showXpToast(row, uid) {
  // Achievement-Vergabe (reason = "achievement:<key>")
  if (typeof row.reason === "string" && row.reason.startsWith("achievement:")) {
    const key = row.reason.slice("achievement:".length);
    toast("Achievement freigeschaltet", { description: ACHIEVEMENTS[key]?.name || key, icon: <Trophy size={16} color="#D9A005" />, duration: 4500 });
    return;
  }
  // Level-up-Erkennung (xp_total vor/nach dieser Vergabe)
  (async () => {
    let newLevel = null;
    try {
      const { data: prof } = await supabase.from("profiles").select("xp_total").eq("id", uid).maybeSingle();
      const newXp = prof?.xp_total ?? 0;
      const before = calculateLevel(Math.max(0, newXp - (row.amount || 0)));
      const after = calculateLevel(newXp);
      if (before.key !== after.key) newLevel = after;
    } catch {}
    if (newLevel) {
      toast.custom(() => (
        <div style={{
          display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: 14,
          background: "#fff", border: `1.5px solid ${newLevel.color}`, boxShadow: "0 10px 34px rgba(0,0,0,.16)", minWidth: 280,
        }}>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: `${newLevel.color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <BeeIcon size={23} color={newLevel.color} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: newLevel.color }}>Level aufgestiegen</p>
            <p style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 900, color: "#191615", fontFamily: "'General Sans','Manrope',sans-serif" }}>{newLevel.name}</p>
            {newLevel.perk && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#757575" }}>Neu: {newLevel.perk}</p>}
          </div>
        </div>
      ), { duration: 6000 });
    } else {
      toast(`+${row.amount} Pollen`, { description: reasonLabel(row.reason), icon: <Zap size={16} color="#0E9493" />, duration: 2600 });
    }
  })();
}

function showNektarToast(row) {
  const positive = (row.amount || 0) >= 0;
  toast(`${positive ? "+" : "−"}${Math.abs(row.amount)} Nektar`, {
    description: positive ? nektarReasonLabel(row.reason) : "Belohnung eingelöst",
    icon: <Droplets size={16} color="#C8860A" />,
    duration: 2800,
  });
}

// Sofort-Feedback für serverseitig (per DB-Trigger) vergebene XP/Achievements.
// Pollt die eigenen neuen xp_log-Zeilen (zuverlässig, unabhängig von Realtime).
export default function GamificationProvider() {
  const [uid, setUid] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUid(data?.user?.id || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUid(session?.user?.id || null));
    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  // Ein gemeinsamer Poller für xp_log + nektar_log (statt zwei getrennte
  // 6s-Intervalle). Beide Abfragen laufen parallel, Intervall 15s.
  useEffect(() => {
    if (!uid) return;
    let lastXp = null, lastNektar = null;
    let stopped = false;

    (async () => {
      const [{ data: xp }, { data: nk }] = await Promise.all([
        supabase.from("xp_log").select("created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(1),
        supabase.from("nektar_log").select("created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(1),
      ]);
      if (!stopped) {
        lastXp = xp?.[0]?.created_at || new Date(0).toISOString();
        lastNektar = nk?.[0]?.created_at || new Date(0).toISOString();
      }
    })();

    async function poll() {
      if (stopped || document.hidden || lastXp === null || lastNektar === null) return;
      try {
        const [{ data: xp }, { data: nk }] = await Promise.all([
          supabase.from("xp_log").select("id, amount, reason, created_at").eq("user_id", uid).gt("created_at", lastXp).order("created_at", { ascending: true }).limit(10),
          supabase.from("nektar_log").select("id, amount, reason, created_at").eq("user_id", uid).gt("created_at", lastNektar).order("created_at", { ascending: true }).limit(10),
        ]);
        if (xp && xp.length) { lastXp = xp[xp.length - 1].created_at; xp.forEach((row) => showXpToast(row, uid)); }
        if (nk && nk.length) { lastNektar = nk[nk.length - 1].created_at; nk.forEach((row) => showNektarToast(row)); }
      } catch {}
    }

    const iv = setInterval(poll, 15000);
    const onFocus = () => poll();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      stopped = true;
      clearInterval(iv);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [uid]);

  return <Toaster position="top-center" toastOptions={{ style: { fontFamily: "'Manrope', sans-serif" } }} />;
}
