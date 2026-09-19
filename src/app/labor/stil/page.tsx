// Stilseite im Look der Framer-Vorlage "Ecomiz" (19.09.2026). Nicht verlinkt, nicht indexiert.
// Liegt ausserhalb von (public), weil sie ihren eigenen Header mit dem Bienen-Logo mitbringt.
// Fällt die Entscheidung, wandern die Bausteine auf die echte Seite und diese Route kann weg.
import StilLabor from './StilLabor'

export const metadata = { title: 'Labor: Stil', robots: { index: false, follow: false } }

export default function Page() {
  return <StilLabor />
}
