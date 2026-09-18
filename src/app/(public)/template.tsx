// Seitenwechsel: kurzes Einblenden (Effekte, 18.09.2026). Nur Deckkraft, kein
// transform, damit position: fixed in den Seiten weiter am Viewport haengt.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="bd-fx-page">{children}</div>
}
