"use client";
// Leichter WYSIWYG-Editor fuer die Inserats-Beschreibung: Fett, Kursiv,
// Aufzaehlung, Zwischentitel. Kein Fremdpaket — contentEditable + execCommand
// (veraltet markiert, aber in allen Browsern stabil fuer genau diese Basics).
// Eingefuegtes HTML wird SOFORT durch sanitizeDescription gefiltert; final
// filtert zusaetzlich createListing/updateListing beim Speichern.
import { useRef, useEffect } from "react";
import { Bold, Italic, List, Heading2 } from "lucide-react";
import { colors, fonts } from "@/lib/theme";
import { sanitizeDescription, isFormattedDescription, plainToHtml } from "@/lib/richtext";

export default function RichTextEditor({ value, onChange, placeholder = "", style = {} }) {
  const ref = useRef(null);
  const lastHtml = useRef(null);

  // Fremde Wertaenderungen (Init, Import, KI-Text) uebernehmen — aber NIE
  // waehrend des Tippens: der Roundtrip innerHTML -> sanitize normalisiert
  // z.B. das &nbsp;, das der Browser fuer ein Leerzeichen am Textende setzt.
  // Der Vergleich schluege fehl, der Editor wuerde zurueckgesetzt und der
  // Cursor spraenge an den Anfang (Space-Bug).
  useEffect(() => {
    if (!ref.current) return;
    if (document.activeElement === ref.current) {
      lastHtml.current = ref.current.innerHTML;
      return;
    }
    const incoming = isFormattedDescription(value) ? sanitizeDescription(value) : plainToHtml(value || "");
    if (incoming !== lastHtml.current) {
      ref.current.innerHTML = incoming;
      lastHtml.current = incoming;
    }
  }, [value]);

  const emit = () => {
    const html = ref.current.innerHTML;
    lastHtml.current = html;
    onChange(html);
  };

  const cmd = (name, arg = null) => {
    ref.current?.focus();
    document.execCommand(name, false, arg);
    emit();
  };

  const onPaste = (e) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");
    const clean = html ? sanitizeDescription(html) : plainToHtml(text);
    document.execCommand("insertHTML", false, clean);
    emit();
  };

  const btn = (Icon, title, onClick) => (
    <button
      type="button" title={title}
      onMouseDown={(e) => e.preventDefault()} // Auswahl im Editor nicht verlieren
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 32, height: 30, border: `1px solid ${colors.border}`, background: "#fff",
        cursor: "pointer", borderRadius: 10, color: colors.dark,
      }}
    >
      <Icon size={15} />
    </button>
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        {btn(Bold, "Fett", () => cmd("bold"))}
        {btn(Italic, "Kursiv", () => cmd("italic"))}
        {btn(List, "Aufzählung", () => cmd("insertUnorderedList"))}
        {btn(Heading2, "Zwischentitel", () => {
          // Toggle: ist die Auswahl schon ein Zwischentitel, zurueck zu Absatz
          const isH3 = document.queryCommandValue("formatBlock").toLowerCase() === "h3";
          cmd("formatBlock", isH3 ? "<p>" : "<h3>");
        })}
      </div>
      <div
        ref={ref}
        className="rte-area"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={emit}
        onPaste={onPaste}
        style={{
          width: "100%", minHeight: 130, padding: "12px 14px", borderRadius: 10,
          border: `1.5px solid ${colors.border}`, fontSize: 14, lineHeight: 1.6,
          fontFamily: fonts.body, background: "#fff", outline: "none",
          overflowY: "auto", maxHeight: 420, boxSizing: "border-box",
          ...style,
        }}
      />
    </div>
  );
}
