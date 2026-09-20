// Pixel-B, das BEEDARO-Logo (Entwurf von Denis, Datei beedaro_logo_new_2.svg, Stand 20.09.2026):
// ein B, dessen linke Kante sich in Quadrate auflöst. Raster 177, Originalfarbe Zitrone #FBF062.
// Um 90 Grad gegen den Uhrzeiger gedreht liegen die zwei Bögen oben und die Quadrate bilden
// die Spitze: So dient dasselbe Zeichen als Favoriten-Herz (herz).
// Die Farbe kommt aus currentColor, damit es auf jedem Grund einsetzbar ist.
//
// Das ganze Zeichen ist EIN Pfad. In der ersten Fassung waren B und Quadrate getrennte Flächen, die genau
// aneinanderstiessen: Beim Glätten liess der Browser dort eine feine helle Linie durchscheinen (Denis 20.09.).
// Zusätzlich ragen die drei Quadrate, die am B anliegen, drei Einheiten in das B hinein. So bleibt die Kante
// auch bei krummen Grössen geschlossen. Sichtbar ist das nicht, das B deckt die Überlappung.
export const LOGO_ZITRONE = "#FBF062";

const B = "M828.18,480.94c-25.47-16.41-53.33-27.63-83.53-33.67v-9.55c30.21-6.04,58.06-17.26,83.53-33.67,25.37-16.41,45.7-38.64,60.84-66.71,15.11-28.04,22.68-62.79,22.68-104.26s-10.23-80.91-30.42-115.88c-20.38-34.98-51.16-63.25-92.64-84.83C747.22,10.82,694.53,0,630.65,0h-99.65v885h99.65c63.88,0,116.57-10.82,157.99-32.37,41.47-21.58,72.25-49.85,92.64-84.83,20.19-34.97,30.42-73.61,30.42-115.88s-7.57-76.23-22.68-104.26c-15.14-28.08-35.47-50.3-60.84-66.71Z";
// [x, y, Breite]: Quadrate aus der Datei. Die drei in der Spalte am B (x = 354) sind 3 breiter und reichen ins B.
const QUADRATE = [[177, 177.5, 177], [354, 354.5, 180], [177, 531.5, 177], [0, 354.5, 177], [354, 708.5, 180], [354, 0.5, 180]];
// Die Quadrate laufen in DERSELBEN Richtung wie das B (gegen den Uhrzeiger: links hinunter, unten nach rechts, rechts
// hinauf). Bei entgegengesetzter Richtung höbe sich die Überlappung mit der Füllregel "nonzero" auf und es entstünde ein Loch.
const PFAD = B + QUADRATE.map(([x, y, b]) => `M${x},${y}v177h${b}v-177Z`).join("");

export default function BLogo({ size = 40, herz = false, title = "BEEDARO", style = undefined, className = undefined }) {
  return (
    <svg
      width={size} height={herz ? (size * 911.7) / 885.5 : (size * 885.5) / 911.7} viewBox={herz ? "0 0 885.5 911.7" : "0 0 911.7 885.5"}
      role="img" aria-label={title || undefined} aria-hidden={title ? undefined : true}
      className={className} style={{ display: "block", ...style }}
    >
      {/* Herz: um den Ursprung drehen, dann nach unten in die Fläche schieben */}
      <path d={PFAD} fill="currentColor" fillRule="nonzero" transform={herz ? "translate(0 911.7) rotate(-90)" : undefined} />
    </svg>
  );
}
