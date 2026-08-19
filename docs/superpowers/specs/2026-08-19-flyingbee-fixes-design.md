# FlyingBee: Aufpopp-Fix + kein Erscheinen im Hintergrund-Tab — Design-Spec

Datum: 19.08.2026 · Status: freigegeben

## Problem
1. Nach Klick, Spruch und Abflug poppte die Biene kurz an ihrer letzten
   Position auf: die Abflug-Web-Animation lief ohne fill:"forwards", nach
   deren Ende sprang das Element einen Frame auf den alten Inline-Transform
   zurueck, bevor React das Ausblenden renderte. Gleiches Muster beim Start:
   sichtbar geschaltet, bevor der erste Animationsschritt die Spawn-Position
   setzte.
2. Der Zufalls-Timer ignorierte document.hidden: die Biene konnte in einem
   inaktiven Tab erscheinen (und hing dort eingefroren).

## Fix (alles in src/components/shared/FlyingBee.jsx)
- abflug(): Animation mit fill:"forwards".
- landen(): Bild SYNCHRON verstecken (bee.style.display="none") und die
  Animation canceln, bevor React rendert.
- fliegen(): document.hidden -> kein Flug (Zaehler unverbraucht, Pruefung vor
  sessionStorage); Spawn-Transform + Blickrichtung synchron setzen, DANN
  sichtbar schalten.
- visibilitychange: wird der Tab waehrend Flug/Spruch verlassen, landet die
  Biene still (kein eingefrorener Rest beim Zurueckkommen).

## Verifikation
Preview: Alt+B -> anklicken -> Spruch -> Abflug ohne Aufpopp-Frame; zweiter
Flug startet von aussen; simuliertes visibilitychange beendet den Flug.
