import { CreditCard, Clock, CheckCircle, Truck, MapPin, Star, X, AlertTriangle } from "lucide-react";

// Einzige Quelle für Bestell-/Kauf-Status (Label, Farbe, Icon).
// Superset über alle Flows (Kauf, Miete/Rückgabe, Service). Genutzt von
// /purchases, /sales und /order/[id].
export const PURCHASE_STATUS = {
  confirmed:       { label: "Warten auf Zahlung", color: "#F4A100", icon: CreditCard },
  pending_payment: { label: "Warten auf Zahlung", color: "#F4A100", icon: CreditCard },
  payment_pending: { label: "Warten auf Zahlung", color: "#F4A100", icon: CreditCard },
  payment_marked:  { label: "Zahlung markiert",   color: "#F4A100", icon: Clock },
  paid:            { label: "Bezahlt",            color: "#5B8C5A", icon: CheckCircle },
  shipped:         { label: "Versendet",          color: "#94B9C9", icon: Truck },
  picked_up:       { label: "Übergeben",          color: "#94B9C9", icon: MapPin },
  delivered:       { label: "Empfangen",          color: "#5B8C5A", icon: CheckCircle },
  completed:       { label: "Abgeschlossen",      color: "#5B8C5A", icon: Star },
  cancelled:       { label: "Storniert",          color: "#c62828", icon: X },
  disputed:        { label: "Beanstandet",        color: "#c62828", icon: AlertTriangle },
  return_pending:  { label: "Rückgabe markiert",  color: "#F4A100", icon: Clock },
  returned:        { label: "Zurückgegeben",      color: "#5B8C5A", icon: CheckCircle },
  damage_reported: { label: "Schaden gemeldet",   color: "#c62828", icon: AlertTriangle },
};
