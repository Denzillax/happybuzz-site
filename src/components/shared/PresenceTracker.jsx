"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/supabase";

// Meldet den Besucher im Realtime-Presence-Kanal "online" an, damit das
// Admin-Dashboard (Analytik -> Gerade online) live sieht, wer auf welcher
// Seite ist. Eingeloggte mit Name/Avatar, Gaeste nur anonym gezaehlt.
// Beim Schliessen des Tabs raeumt Presence automatisch auf.
export default function PresenceTracker() {
  const pathname = usePathname();
  const chRef = useRef(null);
  const infoRef = useRef(null);

  useEffect(() => {
    let aktiv = true;
    (async () => {
      let info;
      let key;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: prof } = await supabase.from("profiles").select("display_name, username, avatar_url").eq("id", user.id).maybeSingle();
          info = { user_id: user.id, name: prof?.display_name || prof?.username || "Mitglied", avatar: prof?.avatar_url || null, guest: false };
          key = user.id;
        } else {
          info = { user_id: null, name: null, avatar: null, guest: true };
          key = `gast-${Math.random().toString(36).slice(2, 10)}`;
        }
      } catch {
        return;
      }
      if (!aktiv) return;
      infoRef.current = { ...info, seit: new Date().toISOString() };
      const ch = supabase.channel("online", { config: { presence: { key } } });
      chRef.current = ch;
      // Wichtig: Ohne Presence-Listener VOR dem Subscribe aktiviert der
      // Realtime-Server keine Presence-Sync-Daten fuer diesen Kanal.
      ch.on("presence", { event: "sync" }, () => {});
      ch.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          ch.track({ ...infoRef.current, path: window.location.pathname }).catch(() => {});
        }
      });
    })();
    return () => {
      aktiv = false;
      if (chRef.current) supabase.removeChannel(chRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Seitenwechsel: aktuellen Pfad nachmelden
  useEffect(() => {
    const ch = chRef.current;
    if (ch && infoRef.current && ch.state === "joined") {
      ch.track({ ...infoRef.current, path: pathname }).catch(() => {});
    }
  }, [pathname]);

  return null;
}
