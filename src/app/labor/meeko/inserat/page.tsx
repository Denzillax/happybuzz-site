// Inseratseite im Meeko-Stil: Auktion mit Gebotsverlauf (19.09.2026). Nicht verlinkt, nicht indexiert.
import MeekoInserat from './MeekoInserat'

export const metadata = { title: 'Labor: Meeko, Inserat', robots: { index: false, follow: false } }

export default function Page() {
  return <MeekoInserat />
}
