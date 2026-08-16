"use client";

// Ein-Klick-Bewerbung fuer Angemeldete: Beta-Tester (alle Allrounder, keine
// Rollenwahl) und Mitarbeiter-Funktionen mit Erklaerung. Kein Formular - wir
// wissen, wer klickt. Der Klick legt eine applications-Zeile an und
// benachrichtigt den Owner (Glocke). Eine Bewerbung schaltet NIE selbst eine
// Rolle frei; die Vergabe macht der Owner im Mitarbeiter-Tab.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/supabase";
import { createNotification } from "@/lib/notifications";
import { Sparkles, Check, LifeBuoy, ShieldCheck, Receipt, Briefcase } from "lucide-react";
import { K, MONO, HEAD, BODY } from "@/lib/katalog";

const OWNER_ID = "48fbdb7f-68a2-4d7d-9bbd-5fe31c7a92c0";

// Beta-Tester: bewusst KEINE Rollenwahl — alle testen als Allrounder querbeet.
const TESTER = {
  key: "beta_tester", label: "Beta-Tester (Allrounder)", Icon: Sparkles,
  desc: "Du testest querbeet: kaufen, verkaufen, mieten, bieten. Hak die Checkliste ab und melde alles, was klemmt, über den Feedback-Knopf.",
};

// Mitarbeiter-Funktionen: Erklärung nennt, was man tut und welche
// Admin-Bereiche man sieht (abgeleitet aus ROLE_TABS in lib/staff.js).
const FUNKTIONEN = [
  { key: "mitarbeiter_support",    label: "Support",    Icon: LifeBuoy,    desc: "Hilft Nutzern bei Fragen und Problemen. Du siehst: Benutzer, Bestellungen, Meldungen, E-Mails, Feedback." },
  { key: "mitarbeiter_moderation", label: "Moderation", Icon: ShieldCheck, desc: "Prüft neue Inserate und Meldungen, greift bei Verstössen durch. Du siehst: Inserate, Meldungen, Benutzer." },
  { key: "mitarbeiter_finance",    label: "Finanzen",   Icon: Receipt,     desc: "Behält Gebühren, Rechnungen und Mahnwesen im Blick. Du siehst: Rechnungen, Mahnungen, Analytik." },
  { key: "mitarbeiter_manager",    label: "Manager",    Icon: Briefcase,   desc: "Koordiniert den ganzen Betrieb. Du siehst: fast alle Bereiche." },
];

// Top-Level (NICHT in der Page definieren): eine Inline-Komponente wäre bei
// jedem Render ein neuer Typ, React würde alle Karten neu mounten — Klicks
// auf gerade ausgetauschte Knoten verpuffen (so beim ersten Live-Test passiert).
function Karte({ r, beworben, busy, onClick, breit }) {
  return (
    <button onClick={onClick} disabled={beworben || busy}
      style={{
        display: "block", width: breit ? "100%" : undefined,
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
}

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
        const alsWas = rolle.key === "beta_tester" ? "als Beta-Tester testen" : `als Mitarbeiter mitarbeiten (${rolle.label})`;
        await createNotification(OWNER_ID, "application", "Neue Bewerbung", `${name} möchte ${alsWas}.`, "/admin");
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
          Mach mit bei BEEDARO.
        </h1>
        <p style={{ fontFamily: BODY, fontSize: 15, color: "rgba(20,17,13,0.65)", lineHeight: 1.7, margin: "0 0 28px", maxWidth: 560 }}>
          Ein Klick genügt. Du bist angemeldet, wir wissen wer du bist — Denis
          bekommt deine Bewerbung direkt aufs Pult und meldet sich bei dir.
        </p>

        {/* ── Beta-Tester: eine Karte, alle sind Allrounder ── */}
        <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: K.ink, margin: "0 0 10px" }}>
          Beta-Tester
        </p>
        <Karte r={TESTER} beworben={meine.has(TESTER.key)} busy={busy === TESTER.key} onClick={() => bewerben(TESTER)} breit />

        {/* ── Mitarbeiter: Funktion wählen, Erklärung inklusive ── */}
        <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: K.ink, margin: "30px 0 10px" }}>
          Mitarbeiter werden
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
          {FUNKTIONEN.map((r) => (
            <Karte key={r.key} r={r} beworben={meine.has(r.key)} busy={busy === r.key} onClick={() => bewerben(r)} />
          ))}
        </div>

        <p style={{ fontFamily: BODY, fontSize: 12.5, color: "rgba(20,17,13,0.55)", lineHeight: 1.6, margin: "18px 0 0", maxWidth: 560 }}>
          Deine Bewerbung geht direkt an Denis. Die Rolle wird persönlich vergeben —
          eine Bewerbung schaltet nichts frei. Mehrere Funktionen? Klick einfach mehrere an.
        </p>
      </div>
    </div>
  );
}
