# Chat aus Buchung und Bestellung: Umsetzungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Von jeder Buchung und jeder Bestellung mit einem Klick in den bestehenden Inserat-Chat, bei überfälligen Mieten mit vorbereiteter Nachricht im Eingabefeld.

**Architecture:** Der Chat bleibt eine Konversation pro Inserat, Käufer und Verkäufer. Eine neue Funktion `openBookingChat` in `src/lib/listings.js` sucht oder erstellt sie und wird von Inseratseite, Buchungsseite und Bestellseite genutzt. Die Vorlage liefert `mahnText` in `src/lib/bookingStatus.js`; sie geht als Suchparameter `text` an `/chat/[id]`, das ihn einmal ins leere Eingabefeld setzt.

**Tech Stack:** Next.js 14 App Router, Supabase JS (Tabelle `conversations`), Vitest (`npm test`), Lucide Icons.

**Zwei Bäume:** Alle Tasks zuerst in `C:\Users\Denzil\BEEDARO` (master, Meeko), danach identisch in `C:\Users\Denzil\BEEDARO-alt` (Zweig `biene-challenge-alt`, Live-Design). Die betroffenen Stellen sind in beiden Bäumen gleich, nur Farben und Rundungen unterscheiden sich (Meeko: Rand `1px solid #1D1D1D`, Rundung 20; alt: Rand `1px solid #E5E8EC`, Rundung 12). Spec: `docs/superpowers/specs/2026-09-24-buchungs-chat-design.md`.

---

### Task 1: Vorlage `mahnText` mit Test

**Files:**
- Modify: `src/lib/bookingStatus.js` (ans Ende)
- Create: `tests/bookingStatus.test.js`

- [ ] **Step 1: Test schreiben**

```js
import { describe, it, expect } from "vitest";
import { bookingState, mahnText } from "@/lib/bookingStatus";

describe("mahnText", () => {
  it("Vermieter fragt nach der Rückgabe mit Datum", () => {
    expect(mahnText("owner", "Tromä", "2026-08-31"))
      .toBe('Hallo, die Rückgabe von "Tromä" war am 31. Aug. vereinbart. Wann bekomme ich sie zurück?');
  });
  it("Mieter meldet sich spät dran", () => {
    expect(mahnText("renter", "Tromä", "2026-08-31"))
      .toBe('Hallo, ich bin mit "Tromä" spät dran. Wann kann ich sie zurückbringen?');
  });
  it("ohne Titel steht das Inserat", () => {
    expect(mahnText("renter", null, "2026-08-31")).toContain('"dem Inserat"');
  });
});

describe("bookingState", () => {
  const heute = new Date(2026, 8, 24); // 24.09.2026
  it("bestätigte Miete mit Enddatum in der Vergangenheit ist überfällig", () => {
    const s = bookingState({ status: "confirmed", start_date: "2026-08-20", end_date: "2026-08-31", listing: { listing_type: "rent" }, purchase: { status: "delivered" } }, heute);
    expect(s.key).toBe("overdue");
    expect(s.ueberfaellig).toBe(24);
  });
  it("abgeschlossene Bestellung schliesst die Buchung", () => {
    const s = bookingState({ status: "confirmed", start_date: "2026-08-28", end_date: "2026-08-28", listing: { listing_type: "service" }, purchase: { status: "completed" } }, heute);
    expect(s.offen).toBe(false);
  });
});
```

- [ ] **Step 2: Test laufen lassen, muss fehlschlagen**

Run: `npx vitest run tests/bookingStatus.test.js`
Expected: FAIL, `mahnText is not a function` (bookingState-Tests grün).

- [ ] **Step 3: `mahnText` implementieren** (ans Ende von `src/lib/bookingStatus.js`)

```js
// Vorbereitete Nachricht für den Chat bei überfälliger Miete (Spec 24.09.2026). Wird nur ins Eingabefeld
// gesetzt, nie automatisch gesendet. Tonalität: direkt, trocken, keine Ausrufezeichen.
export function mahnText(rolle, titel, endDatum) {
  const t = titel || "dem Inserat";
  if (rolle === "owner") {
    const d = new Date(endDatum);
    const datum = isNaN(d) ? "dem vereinbarten Tag" : d.toLocaleDateString("de-CH", { day: "numeric", month: "short" });
    return `Hallo, die Rückgabe von "${t}" war am ${datum} vereinbart. Wann bekomme ich sie zurück?`;
  }
  return `Hallo, ich bin mit "${t}" spät dran. Wann kann ich sie zurückbringen?`;
}
```

- [ ] **Step 4: Test laufen lassen, muss grün sein**

Run: `npx vitest run tests/bookingStatus.test.js`
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/bookingStatus.js tests/bookingStatus.test.js
git commit -m "feat(buchungen): mahnText Vorlage fuer den Chat bei ueberfaelliger Miete, Tests fuer bookingState"
```

---

### Task 2: `openBookingChat` in `listings.js`, Inseratseite nutzt sie

**Files:**
- Modify: `src/lib/listings.js` (nach `getOrCreateConversation`, ca. Zeile 1068)
- Modify: `src/app/(public)/listing/[id]/ListingClient.jsx:453-474` (`startPrivateChat`)

- [ ] **Step 1: Funktion einfügen** (direkt nach `getOrCreateConversation`)

```js
// Privaten Chat zu Inserat + Käufer + Verkäufer finden oder anlegen und die ID zurückgeben.
// Genutzt von Inseratseite, Buchungsseite und Bestellseite (Spec 24.09.2026). null bei Chat mit sich selbst.
export async function openBookingChat({ listingId, buyerId, sellerId }) {
  if (!listingId || !buyerId || !sellerId || buyerId === sellerId) return null;
  const { data: existing } = await supabase.from("conversations")
    .select("id").eq("listing_id", listingId).eq("buyer_id", buyerId).eq("seller_id", sellerId).eq("is_public", false).maybeSingle();
  if (existing?.id) return existing.id;
  const { data: nc, error } = await supabase.from("conversations")
    .insert({ listing_id: listingId, buyer_id: buyerId, seller_id: sellerId, is_public: false })
    .select("id").single();
  if (error) throw error;
  return nc?.id || null;
}
```

- [ ] **Step 2: `startPrivateChat` in `ListingClient.jsx` auf die Funktion umstellen**

Den try-Block (Zeilen 459 bis 470, von `const { data: existing }` bis `if (convId) router.push(...)`) ersetzen durch:

```js
      const convId = await openBookingChat({ listingId: l.id, buyerId: user.id, sellerId: l.user_id });
      if (convId) router.push(`/chat/${convId}`);
```

Im Import aus `@/lib/listings` oben in der Datei `openBookingChat` ergänzen.

- [ ] **Step 3: Prüfen**

Run: `npx next lint --file "src/app/(public)/listing/[id]/ListingClient.jsx"` und im Preview ein fremdes Inserat öffnen, "Nachricht" klicken: Chat öffnet wie vorher.

- [ ] **Step 4: Commit**

```bash
git add src/lib/listings.js "src/app/(public)/listing/[id]/ListingClient.jsx"
git commit -m "refactor(chat): openBookingChat als eine Stelle fuer Chat finden/anlegen, Inseratseite nutzt sie"
```

---

### Task 3: Chatseite liest `?text=` ins leere Eingabefeld

**Files:**
- Modify: `src/app/(public)/chat/[id]/page.jsx:4` (Import) und nach Zeile 40 (State)

- [ ] **Step 1: Import erweitern**

Zeile 4: `import { useParams, useRouter, useSearchParams } from "next/navigation";`

- [ ] **Step 2: Effekt einfügen** (nach der Zeile `const fileRef = useRef(null);`)

```js
  // Vorbereiteter Text aus der Buchungs- oder Bestellseite (?text=...): einmal ins leere Feld, nie automatisch senden.
  const suchparameter = useSearchParams();
  useEffect(() => {
    const t = suchparameter?.get("text");
    if (t && t.length <= 500) setNewMsg((alt) => alt || t);
  }, [suchparameter]);
```

- [ ] **Step 3: Prüfen**

Im Preview eine bestehende Chat-URL mit `?text=Hallo%20Test` öffnen: "Hallo Test" steht im Feld, nichts wurde gesendet. Ohne Parameter: Feld leer.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(public)/chat/[id]/page.jsx"
git commit -m "feat(chat): vorbereiteter Text per ?text= im Eingabefeld"
```

---

### Task 4: Buchungsseite: Knopf Nachricht / Anschreiben

**Files:**
- Modify: `src/app/(public)/bookings/page.jsx`

- [ ] **Step 1: Imports**

```js
import { useRouter } from "next/navigation";
import { getMyRentalRequests, getMyBookings, updateBookingStatus, openBookingChat } from "@/lib/listings";
import { bookingState, sortBookings, mahnText } from "@/lib/bookingStatus";
import { CalendarDays, Package, CheckCircle, XCircle, Clock, User, Wrench, Home, AlertTriangle, ChevronDown, RotateCcw, MessageCircle } from "lucide-react";
```

- [ ] **Step 2: State und Handler** (nach `const [zuOffen, setZuOffen] = useState(...)`)

```js
  const router = useRouter();
  const [chatOeffnet, setChatOeffnet] = useState(null); // Buchungs-ID, deren Chat gerade geöffnet wird

  const handleChat = async (b, s, isOwner) => {
    if (chatOeffnet) return;
    setChatOeffnet(b.id);
    try {
      const convId = await openBookingChat({ listingId: b.listing_id, buyerId: b.renter_id, sellerId: b.owner_id });
      if (!convId) { toast.error("Chat konnte nicht geöffnet werden."); return; }
      const text = s.key === "overdue" ? mahnText(isOwner ? "owner" : "renter", b.listing?.title, b.end_date) : "";
      router.push(`/chat/${convId}${text ? "?text=" + encodeURIComponent(text) : ""}`);
    } catch (err) { console.error(err); toast.error("Chat konnte nicht geöffnet werden."); }
    finally { setChatOeffnet(null); }
  };
```

- [ ] **Step 3: Aktionen in `renderBooking`**

`hatAktionen` wird immer wahr (jede Buchung hat den Chat-Knopf): Zeile `const hatAktionen = ...` löschen und den Block `{hatAktionen && (` durch `{(` ersetzen (die schliessende `)}` bleibt). Dann innerhalb `bk-actions`:

Den Link "Zur Bestellung" so ändern, dass er bei Überfälligkeit weiss ist:
```jsx
              <Link href={`/order/${b.purchase_id}`} style={{ padding: "9px 14px", borderRadius: F.radius, background: "#fff", color: K.ink, fontSize: 12, fontWeight: 800, textDecoration: "none", border: F.rand, textAlign: "center", whiteSpace: "nowrap" }}>
                {s.key === "overdue" || s.key === "past" ? "Jetzt abschliessen" : "Zur Bestellung"}
              </Link>
```

Nach dem Link den Chat-Knopf einfügen (gelb bei Überfälligkeit, sonst weiss):
```jsx
            <button className="eckig kein-akzent" onClick={() => handleChat(b, s, isOwner)} disabled={chatOeffnet === b.id}
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 14px", borderRadius: F.radius, border: F.rand, background: s.key === "overdue" ? K.honey : "#fff", color: K.ink, fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: fonts.body, whiteSpace: "nowrap", opacity: chatOeffnet === b.id ? .6 : 1 }}>
              <MessageCircle size={13} /> {s.key === "overdue" ? "Anschreiben" : "Nachricht"}
            </button>
```

- [ ] **Step 4: Prüfen im Preview** (als Denis eingeloggt, Buchungsseite)

Überfällige Tromä-Zeile: gelber Knopf "Anschreiben", weisser Knopf "Jetzt abschliessen". Klick auf Anschreiben: Chat öffnet, Vorlage steht im Feld, nichts gesendet. Zweiter Klick öffnet dieselbe Konversation (gleiche URL). Abgeschlossene Buchung (aufklappen): weisser Knopf "Nachricht".

- [ ] **Step 5: Commit**

```bash
git add "src/app/(public)/bookings/page.jsx"
git commit -m "feat(buchungen): Knopf Nachricht auf jeder Buchung, Anschreiben mit Vorlage bei Ueberfaelligkeit"
```

---

### Task 5: Bestellseite: Nachricht schreiben bei der Gegenpartei

**Files:**
- Modify: `src/app/(public)/order/[id]/page.jsx` (Imports Zeile 6 bis 30, State bei Zeile 134, Seitenleiste Zeile 785 bis 795)

- [ ] **Step 1: Imports**

Zum Import aus `@/lib/listings` `openBookingChat` ergänzen. Neue Zeile: `import { bookingState, mahnText } from "@/lib/bookingStatus";`. Zum Lucide-Import `MessageCircle` ergänzen.

- [ ] **Step 2: Handler** (nach `const [booking, setBooking] = useState(null);`)

```js
  const [chatOeffnet, setChatOeffnet] = useState(false);
  // Chat mit der Gegenpartei (Spec 24.09.2026): bestehender Inserat-Chat, bei überfälliger Miete mit Vorlage im Feld.
  const handleChat = async () => {
    if (chatOeffnet || !purchase) return;
    setChatOeffnet(true);
    try {
      const convId = await openBookingChat({ listingId: purchase.listing_id, buyerId: purchase.buyer_id, sellerId: purchase.seller_id });
      if (!convId) { toast.error("Chat konnte nicht geöffnet werden."); return; }
      let text = "";
      if (booking && purchase.listing?.listing_type === "rent") {
        const s = bookingState({ ...booking, listing: purchase.listing, purchase });
        if (s.key === "overdue") text = mahnText(user?.id === purchase.seller_id ? "owner" : "renter", purchase.listing?.title, booking.end_date);
      }
      router.push(`/chat/${convId}${text ? "?text=" + encodeURIComponent(text) : ""}`);
    } catch (err) { console.error(err); toast.error("Chat konnte nicht geöffnet werden."); }
    finally { setChatOeffnet(false); }
  };
```

Vor dem Einfügen prüfen, wie die Bestellung im State heisst (`purchase`, in der Render-Funktion `p`) und wie der Nutzer heisst (`user`); Namen übernehmen.

- [ ] **Step 3: Knopf in der Seitenleiste** (in `<SidebarSection icon={User} title={counterpartLabel}>`, nach dem `</div>` mit `lineHeight: 1.7`)

```jsx
                <button className="eckig kein-akzent" onClick={handleChat} disabled={chatOeffnet}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", marginTop: 10, padding: "10px 14px", borderRadius: 20, border: "1px solid #1D1D1D", background: "#fff", color: "#1D1D1D", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: fonts.body, opacity: chatOeffnet ? .6 : 1 }}>
                  <MessageCircle size={14} /> Nachricht schreiben
                </button>
```

Im alten Design: `borderRadius: 12, border: "1px solid #E5E8EC", color: "#191615"`.

- [ ] **Step 4: Prüfen im Preview**

Bestellseite der Tromä-Miete (`/order/ea2ee450-b2df-4846-b1e7-5d8e1e337bae`) als Denis: Knopf sichtbar, Klick öffnet Chat mit Vorlage. Eine Kauf-Bestellung: Knopf sichtbar, Chat ohne Vorlage.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(public)/order/[id]/page.jsx"
git commit -m "feat(bestellung): Nachricht schreiben bei der Gegenpartei, Vorlage bei ueberfaelliger Miete"
```

---

### Task 6: Beta-Checkliste

**Files:**
- Modify: `src/app/(public)/beta/page.jsx` (Abschnitte `bids_bookings` und `orders_mgmt`)

- [ ] **Step 1: Punkte ergänzen**

Nach `{ id: "bb_book_mail", ... }`:
```js
      { id: "bb_book_chat", label: "Buchung: Knopf Nachricht öffnet den Chat zum Inserat" },
      { id: "bb_book_chat_mahn", label: "Überfällige Miete: Anschreiben öffnet den Chat mit vorbereitetem Text, nichts wird automatisch gesendet" },
```
Nach `{ id: "om_status_sync", ... }`:
```js
      { id: "om_chat", label: "Bestellseite: Nachricht schreiben öffnet den Chat mit der Gegenpartei" },
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(public)/beta/page.jsx"
git commit -m "docs(beta): Checkliste um Chat aus Buchung und Bestellung ergaenzt"
```

---

### Task 7: Alten Baum nachziehen und pushen

**Files:** dieselben Dateien in `C:\Users\Denzil\BEEDARO-alt` (Zweig `biene-challenge-alt`)

- [ ] **Step 1: Tasks 1 bis 6 im alten Baum wiederholen.** `bookingStatus.js` und `tests/bookingStatus.test.js` können kopiert werden (identisch). Bei `listings.js`, `ListingClient.jsx`, `chat/[id]/page.jsx`, `bookings/page.jsx`, `order/[id]/page.jsx`, `beta/page.jsx` dieselben Änderungen mit den Farben des alten Looks (Rand `#E5E8EC`, Rundung 12, Ink `#191615`).

- [ ] **Step 2: Tests im alten Baum**

Run: `cd ../BEEDARO-alt && npx vitest run tests/bookingStatus.test.js`
Expected: 5 passed.

- [ ] **Step 3: Preview alter Baum (Port 57700)** als Denis: Buchungsseite und Bestellseite wie in Task 4 und 5 prüfen.

- [ ] **Step 4: Commit und Push**

```bash
git add -A src tests
git commit -m "feat(buchungen): Chat aus Buchung und Bestellung, Vorlage bei ueberfaelliger Miete"
git push origin biene-challenge-alt:main
```

Master (Meeko) wird nach Auftrag von Denis gepusht: `git push origin master`.
