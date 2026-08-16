"use client";

// Ein-Klick-Bewerbung als Beta-Tester. Der Nutzer ist angemeldet, wir wissen
// wer er ist - kein Formular, nur die Rolle anklicken. Der Klick legt eine
// Zeile in applications an und benachrichtigt den Owner (Glocke im Admin).
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/supabase";
import { createNotification } from "@/lib/notifications";
import { ShoppingBag, Tag, Home, Sparkles, Check } from "lucide-react";
import { K, MONO, HEAD, BODY } from "@/lib/katalog";

const OWNER_ID = "48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0";

const ROLLEN = [
  { key: "testkaeufer",   label: "Testkäufer",     Icon: ShoppingBag, desc: "Du kaufst Testartikel, prüfst Bestellablauf, Zahlung und Bewertung." },
  { key: "testverkaeufer", label: "Testverkäufer", Icon: Tag,         desc: "Du erstellst Inserate, verkaufst und prüfst Rechnungen und Gebühren." },
  { key: "testvermieter", label: "Test-Vermieter", Icon: Home,        desc: "Du vermietest Dinge, prüfst Buchungen, Kaution und Rückgabe." },
  { key: "allrounder",    label: "Allrounder",     Icon: Sparkles,    desc: "Du testest querbeet alles, was dir in die Finger kommt." },
];

export default function BewerbenPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [meine, setMeine] = useState(new Set());
  const [busy, setBusy] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push("/login?redirect=/bewerben"); return; }
      setUser(session.user);
      const { data } = await supabase.from("applications").select("role").eq("user_id", session.user.id);
      setMeine(new Set((data || []).map(r => r.role)));
      setReady(true);
    })();
  }, [router]);

  const bewerben = async (rolle) => {
    if (busy || meine.has(rolle.key)) return;
    setBusy(rolle.key);
    const { error } = await supabase.from("applications").insert({ user_id: user.id, role: rolle.key });
    if (!error || error.code === "23505") {   // 23505 = schon beworben, gleiche Wirkung
      setMeine(prev => new Set([...prev, rolle.key]));
      if (!error) {
        const { data: p } = await supabase.from("profiles").select("display_name, username").eq("id", user.id).maybeSingle();
        const name = p?.display_name || p?.username || "Jemand";
        await createNotification(OWNER_ID, "application", "Neue Bewerbung", `${name} möchte als ${rolle.label} testen.`, "/admin");
      }
    }
    setBusy(null);
  };

  if (!ready) return <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: BODY, color: "#9A9490" }}>Lade…</div>;

  return (
    <div style={{ background: K.paper, minHeight: "100vh" }}>
      <div style={{ maxWidth: 740, margin: "0 auto", padding: "44px 24px 80px" }}>
        <p style={{ fontFamily: MONO, fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: K.petrol, margin: "0 0 10px" }}>
          Beta-Crew · Bewerbung
        </p>
        <h1 style={{ fontFamily: HEAD, fontSize: "clamp(26px, 4vw, 34px)", fontWeight: 700, color: K.ink, margin: "0 0 10px", letterSpacing: "-0.01em" }}>
          Als was willst du testen?
        </h1>
        <p style={{ fontFamily: BODY, fontSize: 15, color: "rgba(20,17,13,0.65)", lineHeight: 1.7, margin: "0 0 28px", maxWidth: 560 }}>
          Ein Klick genügt. Du bist angemeldet, wir wissen wer du bist — Denis
          bekommt deine Bewerbung direkt aufs Pult und meldet sich bei dir.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
          {ROLLEN.map((r) => {
            const beworben = meine.has(r.key);
            return (
              <button key={r.key} onClick={() => bewerben(r)} disabled={beworben || busy === r.key}
                style={{
                  textAlign: "left", padding: "20px 20px 18px", cursor: beworben ? "default" : "pointer",
                  background: beworben ? "#EEF4EC" : "#fff",
                  border: `1px solid ${beworben ? K.moss : K.ink}`, borderRadius: 0,
                  boxShadow: beworben ? "none" : "4px 4px 0 rgba(20,17,13,.12)",
                  fontFamily: BODY, transition: "all .15s",
                }}>
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, background: beworben ? "#fff" : K.sand, border: `1px solid ${K.ink}`, marginBottom: 12 }}>
                  {beworben ? <Check size={19} color={K.moss} /> : <r.Icon size={19} color={K.ink} />}
                </span>
                <span style={{ display: "block", fontFamily: HEAD, fontSize: 17, fontWeight: 700, color: K.ink, marginBottom: 4 }}>
                  {r.label}
                </span>
                <span style={{ display: "block", fontSize: 13, color: "rgba(20,17,13,0.6)", lineHeight: 1.55 }}>
                  {beworben ? "Beworben. Denis meldet sich bei dir." : r.desc}
                </span>
              </button>
            );
          })}
        </div>

        <p style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".08em", color: "rgba(20,17,13,0.45)", margin: "26px 0 0", textTransform: "uppercase" }}>
          Mehrere Rollen? Klick einfach mehrere an.
        </p>
      </div>
    </div>
  );
}
