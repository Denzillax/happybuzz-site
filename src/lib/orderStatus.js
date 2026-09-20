import { CreditCard, Clock, CheckCircle, Truck, MapPin, Star, X, AlertTriangle } from "lucide-react";

// Einzige Quelle für Bestell-/Kauf-Status (Label, Farbe, Icon).
// Superset über alle Flows (Kauf, Miete/Rückgabe, Service). Genutzt von
// /purchases, /sales und /order/[id].
export const PURCHASE_STATUS = {
  confirmed:       { label: "Warten auf Zahlung", color: "#8A5A00", icon: CreditCard },
  pending_payment: { label: "Warten auf Zahlung", color: "#8A5A00", icon: CreditCard },
  payment_pending: { label: "Warten auf Zahlung", color: "#8A5A00", icon: CreditCard },
  payment_marked:  { label: "Zahlung markiert",   color: "#8A5A00", icon: Clock },
  paid:            { label: "Bezahlt",            color: "#50804F", icon: CheckCircle },
  shipped:         { label: "Versendet",          color: "#1D1D1D", icon: Truck },
  picked_up:       { label: "Übergeben",          color: "#1D1D1D", icon: MapPin },
  delivered:       { label: "Empfangen",          color: "#50804F", icon: CheckCircle },
  completed:       { label: "Abgeschlossen",      color: "#50804F", icon: Star },
  cancelled:       { label: "Storniert",          color: "#c62828", icon: X },
  disputed:        { label: "Beanstandet",        color: "#c62828", icon: AlertTriangle },
  return_pending:  { label: "Rückgabe markiert",  color: "#8A5A00", icon: Clock },
  returned:        { label: "Zurückgegeben",      color: "#50804F", icon: CheckCircle },
  damage_reported: { label: "Schaden gemeldet",   color: "#c62828", icon: AlertTriangle },
};
