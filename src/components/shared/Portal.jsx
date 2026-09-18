"use client";
// Haengt Inhalte direkt an document.body (Denis, 18.09.2026).
// Grund: Ein Fenster mit position: fixed, das in einem Sticky- oder transformierten
// Element sitzt, bleibt in dessen Ebene gefangen. Der z-index hilft dann nicht, und
// der Header liegt darueber. Ueber das Portal liegt das Fenster immer ueber allem.
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function Portal({ children }) {
  const [bereit, setBereit] = useState(false);
  useEffect(() => { setBereit(true); }, []);
  return bereit ? createPortal(children, document.body) : null;
}
