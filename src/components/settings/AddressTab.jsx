"use client";
import { colors } from "@/lib/theme";
import { Check, AlertTriangle } from "lucide-react";
import { Section, Input, Toggle, Btn } from "./shared";
const C = colors;

  export default function AddressTab({ form, updateForm, profile, saving, saveProfile, supabase, showToast, addrResults, setAddrResults, showAddAddr, setShowAddAddr, editAddrIdx, setEditAddrIdx, extraAddrHits, setExtraAddrHits, newAddr, setNewAddr, savedAddresses, setSavedAddresses }) {
  return (
    <>
      <Section
        title="HAUPTADRESSE"
        description="Wird für Versand, Rechnungen und Verifizierung verwendet."
        badge={
          profile?.city && profile?.postal_code && profile?.street ? (
            <span style={{
              fontSize: 11, fontWeight: 700, color: C.green,
              background: C.greenSoft, padding: "3px 10px", borderRadius: 20,
              display: "inline-flex", alignItems: "center", gap: 4,
            }}><Check size={10} /> Vollständig</span>
          ) : (
            <span style={{
              fontSize: 11, fontWeight: 700, color: "#B8860B",
              background: C.yellowSoft, padding: "3px 10px", borderRadius: 20,
              display: "inline-flex", alignItems: "center", gap: 4,
            }}><AlertTriangle size={10} /> Unvollständig</span>
          )
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input
            label="Vorname"
            value={form.first_name || ""}
            onChange={v => updateForm("first_name", v)}
            placeholder="Denis"
          />
          <Input
            label="Nachname"
            value={form.last_name || ""}
            onChange={v => updateForm("last_name", v)}
            placeholder="Mihaljevic"
          />
        </div>
        <Input
          label="Telefonnummer"
          value={form.phone}
          onChange={v => updateForm("phone", v)}
          type="tel"
          placeholder="+41 79 123 45 67"
        />

        {/* Street with Autocomplete */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 6 }}>Strasse & Nr.</div>
          <div style={{ position: "relative" }}>
            <input
              value={form.street}
              onChange={async (e) => {
                const q = e.target.value;
                updateForm("street", q);
                if (q.length < 3) { setAddrResults([]); return; }
                try {
                  const res = await fetch(`https://api3.geo.admin.ch/rest/services/api/SearchServer?searchText=${encodeURIComponent(q)}&type=locations&limit=5&origins=address`);
                  const data = await res.json();
                  setAddrResults((data?.results || []).map(r => {
                    const raw = (r.attrs?.label || "").replace(/<[^>]+>/g, "").trim();
                    // Robust parsing: find 4-digit PLZ pattern to split street/plz/city
                    const m = raw.match(/^(.+?)\s*,?\s*(\d{4})\s+(.+)$/);
                    if (m) return { street: m[1].trim(), plz: m[2], city: m[3].trim() };
                    return { street: raw, plz: "", city: "" };
                  }));
                } catch { setAddrResults([]); }
              }}
              placeholder="Gemeindehausstrasse 11B"
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8,
                border: `1.5px solid ${C.border}`, fontSize: 14, fontFamily: "'Manrope', sans-serif",
                color: C.dark, outline: "none", boxSizing: "border-box",
              }}
              onFocus={e => { e.target.style.borderColor = C.yellow; }}
              onBlur={e => { setTimeout(() => { e.target.style.borderColor = C.border; setAddrResults([]); }, 200); }}
            />
            {addrResults.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 6, maxHeight: 200, overflowY: "auto", zIndex: 50, boxShadow: "0 4px 12px rgba(0,0,0,.1)" }}>
                {addrResults.map((r, i) => (
                  <div key={i} onClick={() => {
                    updateForm("street", r.street);
                    updateForm("postal_code", r.plz);
                    updateForm("city", r.city);
                    setAddrResults([]);
                  }} style={{ padding: "10px 12px", fontSize: 13, cursor: "pointer", borderBottom: "1px solid #f0f0f0" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f5f5f5"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <span style={{ fontWeight: 600 }}>{r.street}</span>
                    <span style={{ color: "#888", marginLeft: 6 }}>{r.plz} {r.city}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 12 }}>
          <Input
            label="PLZ"
            value={form.postal_code}
            onChange={v => updateForm("postal_code", v)}
            placeholder="6010"
          />
          <Input
            label="Ort"
            value={form.city}
            onChange={v => updateForm("city", v)}
            placeholder="Kriens"
          />
        </div>
        <Input label="Land" value="Schweiz" disabled />

        <Toggle
          checked={form.is_billing_address !== false}
          onChange={v => updateForm("is_billing_address", v)}
          label="Als Rechnungsadresse verwenden"
          description="Diese Adresse wird auf QR-Rechnungen und Belegen angezeigt"
        />
      </Section>

      <Btn
        loading={saving}
        onClick={() => saveProfile({
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone,
          street: form.street,
          postal_code: form.postal_code,
          city: form.city,
          canton: form.canton,
        })}
        style={{ width: "100%" }}
      >
        Adresse speichern
      </Btn>

      <div style={{ height: 20 }} />

      <Section
        title="WEITERE LIEFERADRESSEN"
        description="Beim Kauf, Auktionsgewinn oder Buchung als Lieferadresse wählbar."
      >
        {savedAddresses.map((addr, i) => (
          <div key={addr.id} style={{
            padding: 14, borderRadius: 10, border: `1px solid ${editAddrIdx === i ? C.yellow : C.border}`,
            marginBottom: 10, background: editAddrIdx === i ? C.yellowSoft : "#fff",
          }}>
            {editAddrIdx === i ? (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: C.dark }}>Adresse bearbeiten</div>
                <Input label="Bezeichnung" value={newAddr.label} onChange={v => setNewAddr(p => ({ ...p, label: v }))} placeholder="z.B. Geschäft" />
                <Input label="Firma (optional)" value={newAddr.company} onChange={v => setNewAddr(p => ({ ...p, company: v }))} placeholder="Firma GmbH" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Input label="Vorname" value={newAddr.first_name} onChange={v => setNewAddr(p => ({ ...p, first_name: v }))} placeholder="Max" />
                  <Input label="Nachname" value={newAddr.last_name} onChange={v => setNewAddr(p => ({ ...p, last_name: v }))} placeholder="Muster" />
                </div>
                <div style={{ position: "relative" }}>
                  <Input label="Strasse & Nr." value={newAddr.street} onChange={async v => {
                    setNewAddr(p => ({ ...p, street: v }));
                    if (v.length < 3) { setExtraAddrHits([]); return; }
                    try {
                      const res = await fetch(`https://api3.geo.admin.ch/rest/services/api/SearchServer?searchText=${encodeURIComponent(v)}&type=locations&limit=5&origins=address`);
                      const data = await res.json();
                      setExtraAddrHits((data?.results || []).map(r => {
                        const raw = (r.attrs?.label || "").replace(/<[^>]+>/g, "").trim();
                        const m = raw.match(/^(.+?)\s*,?\s*(\d{4})\s+(.+)$/);
                        if (m) return { street: m[1].trim(), plz: m[2], city: m[3].trim() };
                        return { street: raw, plz: "", city: "" };
                      }));
                    } catch { setExtraAddrHits([]); }
                  }} placeholder="Bahnhofstrasse 1" />
                  {extraAddrHits.length > 0 && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 6, maxHeight: 160, overflowY: "auto", zIndex: 50, boxShadow: "0 4px 12px rgba(0,0,0,.1)" }}>
                      {extraAddrHits.map((r, j) => (
                        <div key={j} onClick={() => {
                          setNewAddr(p => ({ ...p, street: r.street, postal_code: r.plz, city: r.city }));
                          setExtraAddrHits([]);
                        }} style={{ padding: "8px 12px", fontSize: 13, cursor: "pointer", borderBottom: "1px solid #f0f0f0" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#f5f5f5"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <span style={{ fontWeight: 600 }}>{r.street}</span>
                          <span style={{ color: "#888", marginLeft: 6 }}>{r.plz} {r.city}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 12 }}>
                  <Input label="PLZ" value={newAddr.postal_code} onChange={v => setNewAddr(p => ({ ...p, postal_code: v }))} placeholder="8001" />
                  <Input label="Ort" value={newAddr.city} onChange={v => setNewAddr(p => ({ ...p, city: v }))} placeholder="Zürich" />
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button onClick={() => { setEditAddrIdx(null); setNewAddr({ label: "", company: "", first_name: "", last_name: "", street: "", postal_code: "", city: "" }); setExtraAddrHits([]); }}
                    style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${C.border}`, background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Manrope', sans-serif" }}>Abbrechen</button>
                  <button onClick={async () => {
                    await supabase.from("user_addresses").update({ label: newAddr.label, company: newAddr.company, first_name: newAddr.first_name, last_name: newAddr.last_name, street: newAddr.street, postal_code: newAddr.postal_code, city: newAddr.city }).eq("id", addr.id);
                    setSavedAddresses(prev => prev.map((a, idx) => idx === i ? { ...a, ...newAddr } : a));
                    setEditAddrIdx(null); setNewAddr({ label: "", company: "", first_name: "", last_name: "", street: "", postal_code: "", city: "" }); setExtraAddrHits([]);
                    showToast("Adresse aktualisiert");
                  }} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: C.yellow, color: C.dark, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Manrope', sans-serif" }}>Speichern</button>
                </div>
              </>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 2 }}>{addr.label}</div>
                  <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
                    {addr.company && <div>{addr.company}</div>}
                    {(addr.first_name || addr.last_name) && <div>{addr.first_name} {addr.last_name}</div>}
                    {addr.street && <div>{addr.street}</div>}
                    <div>{addr.postal_code} {addr.city}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setEditAddrIdx(i); setNewAddr({ label: addr.label || "", company: addr.company || "", first_name: addr.first_name || "", last_name: addr.last_name || "", street: addr.street || "", postal_code: addr.postal_code || "", city: addr.city || "" }); setShowAddAddr(false); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 11, fontWeight: 600 }}>Bearbeiten</button>
                  <button onClick={async () => {
                    await supabase.from("user_addresses").delete().eq("id", addr.id);
                    setSavedAddresses(prev => prev.filter(a => a.id !== addr.id));
                    showToast("Adresse entfernt");
                  }} style={{ background: "none", border: "none", cursor: "pointer", color: "#c62828", fontSize: 11, fontWeight: 600 }}>Entfernen</button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Inline Add Form */}
        {showAddAddr && editAddrIdx === null ? (
          <div style={{ padding: 16, borderRadius: 10, border: `1.5px solid ${C.yellow}`, background: C.yellowSoft, marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: C.dark }}>Neue Adresse</div>
            <Input label="Bezeichnung" value={newAddr.label} onChange={v => setNewAddr(p => ({ ...p, label: v }))} placeholder="z.B. Geschäft, Büro" />
            <Input label="Firma (optional)" value={newAddr.company} onChange={v => setNewAddr(p => ({ ...p, company: v }))} placeholder="Firma GmbH" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input label="Vorname" value={newAddr.first_name} onChange={v => setNewAddr(p => ({ ...p, first_name: v }))} placeholder="Max" />
              <Input label="Nachname" value={newAddr.last_name} onChange={v => setNewAddr(p => ({ ...p, last_name: v }))} placeholder="Muster" />
            </div>
            <div style={{ position: "relative" }}>
              <Input label="Strasse & Nr." value={newAddr.street} onChange={async v => {
                setNewAddr(p => ({ ...p, street: v }));
                if (v.length < 3) { setExtraAddrHits([]); return; }
                try {
                  const res = await fetch(`https://api3.geo.admin.ch/rest/services/api/SearchServer?searchText=${encodeURIComponent(v)}&type=locations&limit=5&origins=address`);
                  const data = await res.json();
                  setExtraAddrHits((data?.results || []).map(r => {
                    const raw = (r.attrs?.label || "").replace(/<[^>]+>/g, "").trim();
                    const m = raw.match(/^(.+?)\s*,?\s*(\d{4})\s+(.+)$/);
                    if (m) return { street: m[1].trim(), plz: m[2], city: m[3].trim() };
                    return { street: raw, plz: "", city: "" };
                  }));
                } catch { setExtraAddrHits([]); }
              }} placeholder="Bahnhofstrasse 1" />
              {extraAddrHits.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 6, maxHeight: 160, overflowY: "auto", zIndex: 50, boxShadow: "0 4px 12px rgba(0,0,0,.1)" }}>
                  {extraAddrHits.map((r, j) => (
                    <div key={j} onClick={() => {
                      setNewAddr(p => ({ ...p, street: r.street, postal_code: r.plz, city: r.city }));
                      setExtraAddrHits([]);
                    }} style={{ padding: "8px 12px", fontSize: 13, cursor: "pointer", borderBottom: "1px solid #f0f0f0" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f5f5f5"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <span style={{ fontWeight: 600 }}>{r.street}</span>
                      <span style={{ color: "#888", marginLeft: 6 }}>{r.plz} {r.city}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 12 }}>
              <Input label="PLZ" value={newAddr.postal_code} onChange={v => setNewAddr(p => ({ ...p, postal_code: v }))} placeholder="8001" />
              <Input label="Ort" value={newAddr.city} onChange={v => setNewAddr(p => ({ ...p, city: v }))} placeholder="Zürich" />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => { setShowAddAddr(false); setNewAddr({ label: "", company: "", first_name: "", last_name: "", street: "", postal_code: "", city: "" }); setExtraAddrHits([]); }}
                style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${C.border}`, background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Manrope', sans-serif" }}>Abbrechen</button>
              <button onClick={async () => {
                if (!newAddr.label) return;
                const { data: { user } } = await supabase.auth.getUser();
                const { data, error } = await supabase.from("user_addresses").insert({ user_id: user.id, ...newAddr }).select().single();
                if (!error && data) setSavedAddresses(prev => [...prev, data]);
                setNewAddr({ label: "", company: "", first_name: "", last_name: "", street: "", postal_code: "", city: "" });
                setShowAddAddr(false); setExtraAddrHits([]);
                showToast("Adresse hinzugefügt");
              }} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: newAddr.label ? C.yellow : "#ccc", color: C.dark, fontSize: 13, fontWeight: 700, cursor: newAddr.label ? "pointer" : "default", fontFamily: "'Manrope', sans-serif" }}>Hinzufügen</button>
            </div>
          </div>
        ) : editAddrIdx === null && (
          <button onClick={() => setShowAddAddr(true)} style={{
            width: "100%", padding: "12px", borderRadius: 8,
            border: `1.5px dashed ${C.border}`, background: "transparent",
            color: C.muted, fontSize: 13, fontWeight: 600, cursor: "pointer",
            fontFamily: "'Manrope', sans-serif",
          }}>
            + Weitere Adresse hinzufügen
          </button>
        )}
      </Section>
    </>
  )
}
