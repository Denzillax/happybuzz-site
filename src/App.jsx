import { useState, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════
   happybuzz. — Coming Soon Landing Page v2
   Fairer Schweizer Marktplatz
   ═══════════════════════════════════════════ */

/* ── DESIGN TOKENS ── */
const T = {
  honey: "#F4C03F",
  honeyHover: "#E0AF2E",
  honeySoft: "#FDF6E3",
  honeyGlow: "rgba(244,192,63,0.12)",
  dark: "#191615",
  bg: "#F9F4EC",
  surface: "#FFFFFF",
  warm: "#F4EFE6",
  border: "#E8E2D8",
  borderLt: "#F0EBE2",
  text: "#191615",
  textMd: "#5C5753",
  textLt: "#9A9490",
  green: "#5B8C5A",
  greenSoft: "#EDF5EC",
  blue: "#94B9C9",
  blueSoft: "#EBF3F7",
  r: 16,
  rSm: 10,
  rLg: 20,
  font: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
};

/* ── LOGO PLACEHOLDER — ersetze mit deiner Base64-URI ── */
const LOGO_URI = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDc2LjQxIDE2OS4xIj4KICA8ZGVmcz4KICAgIDxzdHlsZT4KICAgICAgLmNscy0xIHsKICAgICAgICBmaWxsOiAjMDEwMTAxOwogICAgICB9CgogICAgICAuY2xzLTIgewogICAgICAgIGZpbGw6ICMxYTE3MTY7CiAgICAgIH0KCiAgICAgIC5jbHMtMyB7CiAgICAgICAgZmlsbDogI2Y0YzAzZTsKICAgICAgfQogICAgPC9zdHlsZT4KICA8L2RlZnM+CiAgPGc+CiAgICA8Y2lyY2xlIGNsYXNzPSJjbHMtMyIgY3g9Ijg0LjU0IiBjeT0iODQuNTQiIHI9Ijg0LjU0Ii8+CiAgICA8Zz4KICAgICAgPHBhdGggY2xhc3M9ImNscy0yIiBkPSJNMTQ1Ljc2LDgwLjc3Yy0zLjUyLTQuMTUtOC41Ni02LjctMTMuODMtNy0uMDYsMC0uMTIsMC0uMTksMHYtLjA2aC0xLjg2Yy0uMzksMC0uNzksMC0xLjIyLDAtLjQ4LDAtLjk2LDAtMS40MiwwaC0zLjM1Yy0uNzUsMC0xLjUsMC0yLjI1LDAtLjc2LDAtMS41MSwwLTIuMjcsMC0xLjMzLDAtMi40MiwwLTMuNDQuMDEtLjAyLDAtLjA0LDAtLjA1LDAtLjItLjAxLS41LS4wMy0uODUtLjAzLTMuOTEsMC02LjIzLDIuMDgtNy4yNywzLjMybC0xLjgzLDIuMTl2MS42MWMtLjQxLDEuODItLjQ5LDQuMTMtLjI4LDcuMjMuMDgsMS4xMy4yMywyLjgxLjUyLDQuNDEuMzgsMi4wOCwxLjA1LDQuNDYsMy4wNiw2LjMyLDIuOTMsMi43Miw1LjU5LDQuNzIsOC4zNiw2LjMsMy41NSwyLjAyLDcuMjgsMy4yOSwxMS4xMSwzLjc4LjkyLjEyLDEuODYuMTgsMi43Ny4xOCw0LjQ2LDAsOC43NS0xLjQyLDEyLjA2LTMuOTksMy42NS0yLjg0LDUuOTQtNi44OSw2LjQzLTExLjM5aDBjLjQ5LTQuNTEtMS4wMS05LjA3LTQuMjEtMTIuODRaTTE0Mi4xNiw5Mi43NmMtLjU5LDUuNDYtNi4wNyw5LjA4LTEyLjQ2LDguMjctNi4wNi0uNzctMTAuODEtNC4wNC0xNS4xMy04LjA1LTEuMDQtLjk1LTEuNTktMTAuMDEtLjc5LTEwLjk1LjY4LS44MiwyLjI2LS40OCwzLjIxLS41LDEuNzEtLjAyLDMuNDIuMDIsNS4xNC4wMyw0Ljc2LjAyLDEwLjMtLjg2LDE0LjU3LDEuNjksMy4yNywxLjk1LDUuODMsNS41OCw1LjQ2LDkuNTFaIi8+CiAgICAgIDxwYXRoIGNsYXNzPSJjbHMtMiIgZD0iTTYzLjE1LDgwLjc5di0xLjYxbC0xLjgzLTIuMTljLTEuMDQtMS4yNC0zLjM2LTMuMzItNy4yNy0zLjMyLS4zNSwwLS42NS4wMi0uODUuMDMtLjAyLDAtLjA0LDAtLjA1LDAtMS4wMSwwLTIuMS0uMDEtMy40NC0uMDEtLjc2LDAtMS41MSwwLTIuMjcsMC0uNzUsMC0xLjUsMC0yLjI1LDBoLTMuMzVjLS40NywwLS45NCwwLTEuNDIsMC0uNDMsMC0uODMsMC0xLjIyLDBoLTEuODZ2LjA2Yy0uMDYsMC0uMTIsMC0uMTksMC01LjI3LjMtMTAuMzIsMi44NS0xMy44Myw3LTMuMiwzLjc3LTQuNyw4LjMzLTQuMjEsMTIuODNoMGMuNDksNC41MiwyLjc4LDguNTYsNi40MywxMS40LDMuMzEsMi41Nyw3LjU5LDMuOTksMTIuMDYsMy45OS45MiwwLDEuODUtLjA2LDIuNzctLjE4LDMuODItLjQ5LDcuNTYtMS43NiwxMS4xMS0zLjc4LDIuNzctMS41OCw1LjQzLTMuNTgsOC4zNi02LjMsMi4wMS0xLjg2LDIuNjgtNC4yNCwzLjA2LTYuMzIuMy0xLjYuNDUtMy4yOC41Mi00LjQxLjIxLTMuMTEuMTMtNS40MS0uMjgtNy4yM1pNNTQuNTEsOTIuOThjLTQuMzIsNC4wMS05LjA3LDcuMjgtMTUuMTMsOC4wNS02LjM5LjgxLTExLjg3LTIuODEtMTIuNDYtOC4yNy0uMzctMy45NCwyLjItNy41Niw1LjQ2LTkuNTEsNC4yNy0yLjU1LDkuOC0xLjY2LDE0LjU3LTEuNjksMS43MSwwLDMuNDItLjA1LDUuMTQtLjAzLjk1LjAxLDIuNTItLjMyLDMuMjEuNS44Ljk1LjI1LDEwLS43OSwxMC45NVoiLz4KICAgICAgPHBhdGggY2xhc3M9ImNscy0yIiBkPSJNNTcuNzgsMzguNzdjLjEuMDkuMTkuMTUuMjIuMTctLjA1LS4wNC0uMS0uMDgtLjE1LS4xMi0uMDItLjAyLS4wNS0uMDMtLjA3LS4wNWgwWiIvPgogICAgICA8cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Ik03NC43Miw0Ni45NGMtNC4xOC03LjQ0LTkuMzgtMTUuNTktMTcuNzUtMTguNDktMS40My0yLjgzLTQuMzYtNC43OC03Ljc1LTQuNzgtNC44LDAtOC42OSwzLjg5LTguNjksOC42OXMzLjg5LDguNjksOC42OSw4LjY5YzIuNzksMCw1LjI3LTEuMzIsNi44Ni0zLjM3LjE2LjA5LjMyLjE3LjQ3LjI2LjQxLjI1LjguNTEsMS4xOS43OS4wMi4wMS4wMy4wMi4wNS4wMy0uMDQtLjA0LS4wOS0uMDgtLjEzLS4xMi4wNi4wNi4xMy4xMi4yMS4xNy4xNS4xMS4xOS4xNC4xNS4xMi4wNy4wNS4xNC4xMS4yLjE2Ljc3LjY0LDEuNSwxLjM0LDIuMTgsMi4wNy4zNS4zNy42OS43NiwxLjAyLDEuMTUuMTcuMi4zMy40Mi41MS42MiwwLDAsMCwwLC4wMS4wMS42My44NiwxLjI0LDEuNzIsMS44MSwyLjYxLDEuMjIsMS44OSwyLjMyLDMuODUsMy40Miw1LjgxLDEuMTIsMiw0LjAzLDIuODQsNiwxLjU3LDIuMDItMS4zLDIuNzgtMy44NiwxLjU3LTZoMFoiLz4KICAgICAgPHBhdGggY2xhc3M9ImNscy0yIiBkPSJNMTExLjM5LDM4Ljc3Yy0uMS4wOS0uMTkuMTUtLjIyLjE3LjA1LS4wNC4xLS4wOC4xNS0uMTIuMDItLjAyLjA1LS4wMy4wNy0uMDVaIi8+CiAgICAgIDxwYXRoIGNsYXNzPSJjbHMtMiIgZD0iTTExNC40Myw3Mi42MmMtLjItMy44OS0uODYtNy43My0yLjQ2LTExLjQ4LTEuOTQtNC41Ni01LjA4LTguNDUtOS4wNS0xMS40MWgwYy0uNTQtLjQtMS4xLS43OS0xLjY4LTEuMTUtLjg0LS41My0xLjcxLTEuMDEtMi42MS0xLjQ2LTEuMTMtLjU2LTIuMjktMS4wNC0zLjQ4LTEuNDVoMGMtMy40LTEuMTgtNi45OS0xLjc4LTEwLjU3LTEuNzloLS4wMWMtMS43OSwwLTMuNTkuMTYtNS4zNi40Ni0xLjc3LjMtMy41Mi43NC01LjIyLDEuMzNoMGMtMS4xOS40Mi0yLjM1LjktMy40OCwxLjQ2LS45LjQ0LTEuNzcuOTMtMi42MSwxLjQ2LS41OC4zNy0xLjE0Ljc1LTEuNjgsMS4xNWgwYy0zLjk3LDIuOTYtNy4xMSw2Ljg1LTkuMDUsMTEuNDEtMS42LDMuNzYtMi4yNSw3LjU5LTIuNDYsMTEuNDgtLjE5LDMuNjIuMDIsNy4yOC4yMywxMC45NmgwYy4wNS43OS4wOSwxLjU4LjEzLDIuMzcuMTMsMi41Mi4yMSw1LjA0LjI0LDcuNTdoMGMuMDQsMi43Ny4wMyw1LjU1LjAyLDguMzIsMCwxLjc2LS4wMiwzLjUyLS4wMyw1LjI4LS4wMSwzLjEyLjAyLDYuMy44MSw5LjMzLjc4LDIuOTgsMi40OSw1Ljk0LDQuMzMsOC4zOSwzLjE1LDQuMTgsNy42MSw3LjExLDEyLjYxLDguNjEsMy41NywxLjA2LDUuNTEsMyw3LjAyLDYuMTQuNTcsMS4xOS44NSwyLjQ4LDEuMzksMy42OS42MywxLjM5LDEuNDQsMi4xMywzLjAzLDIuMTRoLjEyYzEuNTksMCwyLjM5LS43NSwzLjAzLTIuMTQuNTQtMS4yLjgyLTIuNSwxLjM5LTMuNjksMS41MS0zLjE0LDMuNDUtNS4wOCw3LjAyLTYuMTQsNS0xLjUsOS40Ni00LjQyLDEyLjYxLTguNjEsMS44NC0yLjQ0LDMuNTUtNS40MSw0LjMzLTguMzkuOC0zLjAzLjgzLTYuMjEuODEtOS4zMywwLTEuNzYtLjAyLTMuNTItLjAzLTUuMjgtLjAxLTIuNzgtLjAyLTUuNTUuMDItOC4zMmgwYy4wNC0yLjUyLjExLTUuMDUuMjQtNy41Ny4wNC0uNzkuMDktMS41OC4xMy0yLjM3aDBjLjIxLTMuNjguNDItNy4zNC4yMy0xMC45NlpNNjMuNjIsODYuODJjLjE1LTQuODIsMC05LjY0LjA1LTE0LjQ2aDBjLjA4LTguODYsNi4xOS0xNy4zNiwxNC44NS0xOS43MiwyLjAxLS41NSw0LjA1LS44MSw2LjA2LS43OSwyLjAxLS4wMSw0LjA1LjI0LDYuMDYuNzksOC42NiwyLjM2LDE0Ljc2LDEwLjg2LDE0Ljg1LDE5LjcyaDBjLjA1LDQuODItLjEsOS42NC4wNSwxNC40Ni4wNywyLjA3LS42MiwyLjUzLTIuNTcsMi40OS02LjExLS4xMy0xMi4yNS0uMTktMTguMzgtLjE5aC0uMDFjLTYuMTMsMC0xMi4yNy4wNi0xOC4zOC4xOS0xLjk0LjA0LTIuNjQtLjQyLTIuNTctMi40OWgwWk04Ny40MiwxMjYuNTNjLS45My4wMy0xLjg4LjA2LTIuODQuMDYtLjk2LDAtMS45MS0uMDMtMi44NC0uMDYtNy4zNC0uMjMtMTQuMDEtNS4xMS0xNi4zOS0xMi4yNiw2LjQyLjQzLDEyLjgxLjQ5LDE5LjIzLjQ3LDYuNDIuMDIsMTIuODItLjA0LDE5LjIzLS40Ny0yLjM4LDcuMTUtOS4wNSwxMi4wMy0xNi4zOSwxMi4yNlpNMTA1LjU1LDEwNC42OGMwLDEuMDItLjg0LDEuODYtMS44NiwxLjg2aC0zOC4yMmMtMS4wMiwwLTEuODYtLjg0LTEuODYtMS44NnYtNC41OGMwLTEuMDIuODQtMS44NiwxLjg2LTEuODZoMzguMjJjMS4wMiwwLDEuODYuODQsMS44NiwxLjg2djQuNThaIi8+CiAgICAgIDxwYXRoIGNsYXNzPSJjbHMtMiIgZD0iTTExMS4zNywzOC43N3MtLjA1LjA0LS4wNy4wNWMtLjA1LjA0LS4xLjA4LS4xNS4xMi4wMy0uMDIuMTItLjA4LjIyLS4xN2gwWiIvPgogICAgICA8cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Ik05NC40Myw0Ni45NGgwYy0xLjIsMi4xNC0uNDUsNC42OSwxLjU3LDYsMS45NywxLjI3LDQuODcuNDMsNi0xLjU3LDEuMS0xLjk2LDIuMi0zLjkyLDMuNDItNS44MS41Ny0uODksMS4xOC0xLjc2LDEuODEtMi42MSwwLDAsMCwwLC4wMS0uMDEuMTctLjIuMzQtLjQxLjUxLS42Mi4zMy0uMzkuNjctLjc3LDEuMDItMS4xNS42OS0uNzMsMS40MS0xLjQyLDIuMTgtMi4wNy4wNi0uMDUuMTMtLjExLjItLjE2LS4wNC4wMiwwLS4wMS4xNS0uMTIuMDctLjA2LjE0LS4xMS4yMS0uMTctLjA1LjA0LS4wOS4wOC0uMTMuMTIuMDItLjAxLjAzLS4wMi4wNS0uMDMuMzktLjI4Ljc4LS41NCwxLjE5LS43OS4xNS0uMDkuMzEtLjE3LjQ3LS4yNiwxLjU5LDIuMDUsNC4wNywzLjM3LDYuODYsMy4zNyw0LjgsMCw4LjY5LTMuODksOC42OS04LjY5cy0zLjg5LTguNjktOC42OS04LjY5Yy0zLjM5LDAtNi4zMiwxLjk1LTcuNzUsNC43OC04LjM3LDIuOS0xMy41NywxMS4wNS0xNy43NSwxOC40OWgwWiIvPgogICAgICA8cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Ik01Ny43NywzOC43N2MuMS4wOS4xOS4xNS4yMi4xNy0uMDUtLjA0LS4xLS4wOC0uMTUtLjEyLS4wMi0uMDItLjA1LS4wMy0uMDctLjA1WiIvPgogICAgICA8cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Ik0xMTEuMzksMzguNzdjLS4xLjA5LS4xOS4xNS0uMjIuMTcuMDUtLjA0LjEtLjA4LjE1LS4xMi4wMi0uMDIuMDUtLjAzLjA3LS4wNVoiLz4KICAgICAgPHBhdGggY2xhc3M9ImNscy0yIiBkPSJNOTMuNSw4NC40MWMtMy4yMSwzLjQ4LTE0LjQ2LDMuMzgtMTcuNzItLjExLTEuMDktMS4xNy0xLjkyLTIuNDYtMS4xNy00LjA5LjY3LTEuNDMsMS45Ny0xLjc3LDMuNS0xLjcxLDIuMjguMDgsNC41Ni4wMiw2Ljg0LjAydi4wNWg2LjA5YzEuNDQsMCwyLjgzLjE1LDMuNSwxLjcxLjcxLDEuNjQuMDIsMi45OS0xLjA0LDQuMTVaIi8+CiAgICAgIDxwYXRoIGNsYXNzPSJjbHMtMiIgZD0iTTg5LjIyLDczLjg1Yy0yLjk2LTIuOTYtMi45Ni03Ljc1LDAtMTAuNywyLjk2LTIuOTYsNy43NS0yLjk2LDEwLjcsMHMyLjk2LDcuNzUsMCwxMC43LTcuNzUsMi45Ni0xMC43LDBaIi8+CiAgICAgIDxwYXRoIGNsYXNzPSJjbHMtMiIgZD0iTTY5LjI0LDczLjg1Yy0yLjk2LTIuOTYtMi45Ni03Ljc1LDAtMTAuNywyLjk2LTIuOTYsNy43NS0yLjk2LDEwLjcsMCwyLjk2LDIuOTYsMi45Niw3Ljc1LDAsMTAuN3MtNy43NSwyLjk2LTEwLjcsMFoiLz4KICAgIDwvZz4KICA8L2c+CiAgPGc+CiAgICA8cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0yMTguNDcsMjkuOGgyNi4yN3YxMDkuNDloLTI2LjI3VjI5LjhaTTI3My45Niw5Ni4zNWMwLTQuNTItMS4yMy04LjEyLTMuNjktMTAuNzctMi40Ni0yLjY2LTUuNzYtMy45OC05Ljg5LTMuOTgtNC44Mi4xLTguNjMsMS44NC0xMS40NCw1LjI0LTIuOCwzLjM5LTQuMjEsNy43NS00LjIxLDEzLjA2aC02LjM1YzAtOS4wNSwxLjMzLTE2LjY1LDMuOTgtMjIuOCwyLjY2LTYuMTUsNi40NC0xMC43OSwxMS4zNi0xMy45NCw0LjkyLTMuMTUsMTAuNzItNC43MiwxNy40MS00LjcyLDUuOSwwLDExLjAyLDEuMjUsMTUuMzUsMy43Niw0LjMzLDIuNTEsNy43LDYuMDUsMTAuMTEsMTAuNjIsMi40MSw0LjU4LDMuNjIsOS45NiwzLjYyLDE2LjE2djUwLjMyaC0yNi4yN3YtNDIuOTRaIi8+CiAgICA8cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0zNDcuNDQsMTA1LjM1Yy0zLjc0LDAtNi41Mi42Ni04LjM0LDEuOTktMS44MiwxLjMzLTIuNzMsMy40Mi0yLjczLDYuMjdzLjkzLDUuMDksMi44LDYuNzFjMS44NywxLjYyLDQuNTIsMi40Myw3Ljk3LDIuNDMsMi42NiwwLDUuMDktLjQ0LDcuMy0xLjMzLDIuMjEtLjg5LDQuMDgtMi4xNCw1LjYxLTMuNzYsMS41Mi0xLjYyLDIuNTMtMy40NywzLjAzLTUuNTNsMy42OSwxMS42NmMtMi4xNyw1LjQxLTUuNjEsOS41NC0xMC4zMywxMi40LTQuNzIsMi44NS0xMC41Myw0LjI4LTE3LjQxLDQuMjgtNS43MSwwLTEwLjYtMS4wOC0xNC42OC0zLjI1LTQuMDgtMi4xNi03LjIxLTUuMTEtOS4zNy04Ljg1LTIuMTctMy43NC0zLjI1LTguMDItMy4yNS0xMi44NCwwLTcuNTcsMi42My0xMy40OCw3Ljg5LTE3LjcxLDUuMjYtNC4yMywxMi44MS02LjM5LDIyLjY1LTYuNDloMjMuMzJ2MTQuMDJoLTE4LjE1Wk0zNjMuMDgsOTAuNDVjMC0zLjg0LTEuMjgtNi44NC0zLjg0LTktMi41Ni0yLjE2LTYuMzUtMy4yNS0xMS4zNi0zLjI1LTMuMzUsMC03LjA4LjU0LTExLjIxLDEuNjItNC4xMywxLjA4LTguMzYsMi43MS0xMi42OSw0Ljg3bC03LjIzLTE3LjQxYzQuMjMtMS44Nyw4LjM0LTMuNDcsMTIuMzItNC44LDMuOTgtMS4zMyw4LjA0LTIuMzQsMTIuMTctMy4wMyw0LjEzLS42OSw4LjM2LTEuMDMsMTIuNjktMS4wMywxMS4xMiwwLDE5LjcsMi41MywyNS43NSw3LjYsNi4wNSw1LjA3LDkuMTIsMTIuMTcsOS4yMiwyMS4zMnY1MS45NGgtMjUuODJ2LTQ4Ljg0WiIvPgogICAgPHBhdGggY2xhc3M9ImNscy0xIiBkPSJNNDA3LjM1LDU5LjYxaDI2LjI3djEwOC4zMWgtMjYuMjdWNTkuNjFaTTQ1Ny4wOCw1OC43MmM3LjQ3LDAsMTMuOTksMS43LDE5LjU1LDUuMDksNS41NiwzLjM5LDkuODksOC4xNywxMi45OSwxNC4zMSwzLjEsNi4xNSw0LjY1LDEzLjQxLDQuNjUsMjEuNzdzLTEuNSwxNS00LjUsMjEuMWMtMyw2LjEtNy4yMywxMC44Mi0xMi42OSwxNC4xNy01LjQ2LDMuMzUtMTEuOTMsNS4wMi0xOS40MSw1LjAyLTYuNjksMC0xMi40Ny0xLjY1LTE3LjM0LTQuOTQtNC44Ny0zLjI5LTguNjEtNy45Ny0xMS4yMS0xNC4wMi0yLjYxLTYuMDUtMy45MS0xMy4yMS0zLjkxLTIxLjQ3czEuMjgtMTUuNzYsMy44NC0yMS45MWMyLjU2LTYuMTUsNi4yMi0xMC44NywxMC45OS0xNC4xNyw0Ljc3LTMuMjksMTAuNDUtNC45NCwxNy4wNC00Ljk0Wk00NTAuNTksNzguOTRjLTMuMjUsMC02LjE3Ljg2LTguNzgsMi41OC0yLjYxLDEuNzItNC42Miw0LjA4LTYuMDUsNy4wOC0xLjQzLDMtMi4xNCw2LjUyLTIuMTQsMTAuNTVzLjcxLDcuNDUsMi4xNCwxMC41NWMxLjQyLDMuMSwzLjQ0LDUuNDksNi4wNSw3LjE2LDIuNjEsMS42Nyw1LjUzLDIuNTEsOC43OCwyLjUxLDMuNDQsMCw2LjQ3LS44Niw5LjA4LTIuNTgsMi42MS0xLjcyLDQuNjItNC4xMSw2LjA1LTcuMTYsMS40Mi0zLjA1LDIuMTQtNi41NCwyLjE0LTEwLjQ4cy0uNzEtNy40My0yLjE0LTEwLjQ4Yy0xLjQzLTMuMDUtMy40NS01LjQzLTYuMDUtNy4xNi0yLjYxLTEuNzItNS42My0yLjU4LTkuMDgtMi41OFoiLz4KICAgIDxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTUwOC41OCw1OS42MWgyNi4yN3YxMDguMzFoLTI2LjI3VjU5LjYxWk01NTguMzEsNTguNzJjNy40NywwLDEzLjk5LDEuNywxOS41NSw1LjA5LDUuNTYsMy4zOSw5Ljg5LDguMTcsMTIuOTksMTQuMzEsMy4xLDYuMTUsNC42NSwxMy40MSw0LjY1LDIxLjc3cy0xLjUsMTUtNC41LDIxLjFjLTMsNi4xLTcuMjMsMTAuODItMTIuNjksMTQuMTctNS40NiwzLjM1LTExLjkzLDUuMDItMTkuNDEsNS4wMi02LjY5LDAtMTIuNDctMS42NS0xNy4zNC00Ljk0LTQuODctMy4yOS04LjYxLTcuOTctMTEuMjEtMTQuMDItMi42MS02LjA1LTMuOTEtMTMuMjEtMy45MS0yMS40N3MxLjI4LTE1Ljc2LDMuODQtMjEuOTFjMi41Ni02LjE1LDYuMjItMTAuODcsMTAuOTktMTQuMTcsNC43Ny0zLjI5LDEwLjQ1LTQuOTQsMTcuMDQtNC45NFpNNTUxLjgyLDc4Ljk0Yy0zLjI1LDAtNi4xNy44Ni04Ljc4LDIuNTgtMi42MSwxLjcyLTQuNjIsNC4wOC02LjA1LDcuMDgtMS40MywzLTIuMTQsNi41Mi0yLjE0LDEwLjU1cy43MSw3LjQ1LDIuMTQsMTAuNTVjMS40MiwzLjEsMy40NCw1LjQ5LDYuMDUsNy4xNiwyLjYxLDEuNjcsNS41MywyLjUxLDguNzgsMi41MSwzLjQ0LDAsNi40Ny0uODYsOS4wOC0yLjU4LDIuNjEtMS43Miw0LjYyLTQuMTEsNi4wNS03LjE2LDEuNDItMy4wNSwyLjE0LTYuNTQsMi4xNC0xMC40OHMtLjcxLTcuNDMtMi4xNC0xMC40OGMtMS40My0zLjA1LTMuNDUtNS40My02LjA1LTcuMTYtMi42MS0xLjcyLTUuNjMtMi41OC05LjA4LTIuNThaIi8+CiAgICA8cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik02NDkuNjUsMTQ3LjI2Yy0yLjk1LDcuMzgtNy4wMywxMi44Ni0xMi4yNSwxNi40NS01LjIyLDMuNTktMTEuNTYsNS4zOS0xOS4wNCw1LjM5LTQuNTMsMC04LjY4LS42Ni0xMi40Ny0xLjk5LTMuNzktMS4zMy03LjUtMy40Mi0xMS4xNC02LjI3bDEwLjkyLTE3Ljg2YzMuNTQsMi45NSw3LjA4LDQuNDMsMTAuNjIsNC40MywyLjE2LDAsNC4wNi0uNTIsNS42OC0xLjU1LDEuNjItMS4wMywyLjkzLTIuNTgsMy45MS00LjY1bDEuOTItMy44NC0zMy4wNS03Ny43N2gyN2wxOS4wNCw1Mi4yNCwxNi45Ny01Mi4yNGgyNi4xMmwtMzQuMjQsODcuNjVaIi8+CiAgICA8cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik02OTMuNDgsMjkuOGgyNi4yN3YxMDkuNDloLTI2LjI3VjI5LjhaTTc0My4yMSw1OC43MmM3LjQ3LDAsMTMuOTksMS43LDE5LjU1LDUuMDksNS41NiwzLjM5LDkuODksOC4xNywxMi45OSwxNC4zMSwzLjEsNi4xNSw0LjY1LDEzLjQxLDQuNjUsMjEuNzdzLTEuNSwxNS00LjUsMjEuMWMtMyw2LjEtNy4yMywxMC44Mi0xMi42OSwxNC4xNy01LjQ2LDMuMzUtMTEuOTMsNS4wMi0xOS40MSw1LjAyLTYuNjksMC0xMi40Ny0xLjY1LTE3LjM0LTQuOTQtNC44Ny0zLjI5LTguNjEtNy45Ny0xMS4yMS0xNC4wMi0yLjYxLTYuMDUtMy45MS0xMy4yMS0zLjkxLTIxLjQ3czEuMjgtMTUuNzYsMy44NC0yMS45MWMyLjU2LTYuMTUsNi4yMi0xMC44NywxMC45OS0xNC4xNyw0Ljc3LTMuMjksMTAuNDUtNC45NCwxNy4wNC00Ljk0Wk03MzYuNzIsNzguOTRjLTMuMjUsMC02LjE3Ljg2LTguNzgsMi41OC0yLjYxLDEuNzItNC42Miw0LjA4LTYuMDUsNy4wOC0xLjQzLDMtMi4xNCw2LjUyLTIuMTQsMTAuNTVzLjcxLDcuNDUsMi4xNCwxMC41NWMxLjQyLDMuMSwzLjQ0LDUuNDksNi4wNSw3LjE2LDIuNjEsMS42Nyw1LjUzLDIuNTEsOC43OCwyLjUxLDMuNDQsMCw2LjQ3LS44Niw5LjA4LTIuNTgsMi42MS0xLjcyLDQuNjItNC4xMSw2LjA1LTcuMTYsMS40Mi0zLjA1LDIuMTQtNi41NCwyLjE0LTEwLjQ4cy0uNzEtNy40My0yLjE0LTEwLjQ4Yy0xLjQzLTMuMDUtMy40NS01LjQzLTYuMDUtNy4xNi0yLjYxLTEuNzItNS42My0yLjU4LTkuMDgtMi41OFoiLz4KICAgIDxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTgxNy44OCwxMDIuNTVjMCw0LjUzLDEuMTUsOC4xMiwzLjQ3LDEwLjc3LDIuMzEsMi42Niw1LjQzLDMuOTgsOS4zNywzLjk4LDQuNzItLjEsOC4zOS0xLjg3LDEwLjk5LTUuMzEsMi42MS0zLjQ0LDMuOTEtNy43NywzLjkxLTEyLjk5aDYuMmMwLDguOTUtMS4yOCwxNi41LTMuODQsMjIuNjUtMi41Niw2LjE1LTYuMiwxMC44LTEwLjkyLDEzLjk0LTQuNzIsMy4xNS0xMC4zOCw0LjcyLTE2Ljk3LDQuNzItNS43MSwwLTEwLjctMS4yNS0xNC45OC0zLjc2LTQuMjgtMi41MS03LjYtNi4wMy05Ljk2LTEwLjU1LTIuMzYtNC41Mi0zLjU0LTkuODktMy41NC0xNi4wOHYtNTAuMzJoMjYuMjd2NDIuOTRaTTg0NS42Miw1OS42MWgyNi4yN3Y3OS42OWgtMjYuMjdWNTkuNjFaIi8+CiAgICA8cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik04ODguMjYsNTkuNjFoNjkuOTV2MTUuNzlsLTM4LjM3LDQ0LjEyaDM5Ljg0djE5Ljc3aC03Mi43NXYtMTUuNzlsMzguMzctNDQuMTJoLTM3LjA0di0xOS43N1oiLz4KICAgIDxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTk3MC4xNiw1OS42MWg2OS45NXYxNS43OWwtMzguMzcsNDQuMTJoMzkuODR2MTkuNzdoLTcyLjc1di0xNS43OWwzOC4zNy00NC4xMmgtMzcuMDR2LTE5Ljc3WiIvPgogICAgPHBhdGggY2xhc3M9ImNscy0zIiBkPSJNMTA2My43MSwxMTUuMjRjMy43NCwwLDYuNzksMS4xNiw5LjE1LDMuNDcsMi4zNiwyLjMxLDMuNTQsNS4zNCwzLjU0LDkuMDhzLTEuMTgsNi43OS0zLjU0LDkuMTUtNS40MSwzLjU0LTkuMTUsMy41NC02LjY0LTEuMTgtOS0zLjU0Yy0yLjM2LTIuMzYtMy41NC01LjQxLTMuNTQtOS4xNXMxLjE4LTYuNzYsMy41NC05LjA4YzIuMzYtMi4zMSw1LjM2LTMuNDcsOS0zLjQ3WiIvPgogIDwvZz4KPC9zdmc+";

/* ── MAILCHIMP CONFIG ── */
const MC = {
  action: "https://happybuzz.us3.list-manage.com/subscribe/post?u=40d19fb37a502ba7b4f823e46&id=3f6104fa23",
  u: "40d19fb37a502ba7b4f823e46",
  id: "3f6104fa23",
};

/* ── ICONS (inline SVG) ── */
const Icons = {
  leaf: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={T.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66L12 14" /><path d="M2 2c4.18 0 10.44 1.56 13.34 7.66C18.24 16 20 22 20 22" />
    </svg>
  ),
  heart: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={T.honey} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  shield: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={T.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  check: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  arrow: (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  store: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={T.dark} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  tag: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={T.dark} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
  zap: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={T.honey} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  mapPin: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={T.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  ),
  x: (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#C0392B" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  checkSmall: (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={T.green} strokeWidth="3" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  clipboard: (s = 24, c = T.honey) => (
    <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  ),
  sliders: (s = 24, c = T.honey) => (
    <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  ),
  sprout: (s = 24, c = T.green) => (
    <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 20h10" /><path d="M12 20v-8" /><path d="M12 12c-3.5 0-6-2.5-6-6 3.5 0 6 2.5 6 6z" /><path d="M12 12c3.5 0 6-2.5 6-6-3.5 0-6 2.5-6 6z" />
    </svg>
  ),
  box: (s = 22, c = T.textMd) => (
    <svg width={s} height={s} fill="none" viewBox="0 0 24 24" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
};

/* ── FONT LOADER ── */
const FontLoader = () => {
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);
  return null;
};

/* ── FADE-IN ON SCROLL ── */
const useFadeIn = (delay = 0) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setTimeout(() => setVisible(true), delay); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return { ref, style: { opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms` } };
};

/* ── SECTION WRAPPER ── */
const Section = ({ children, id, bg, style = {} }) => (
  <section id={id} style={{ padding: "80px 24px", background: bg || "transparent", ...style }}>
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>{children}</div>
  </section>
);

/* ── SECTION HEADING ── */
const SectionHeading = ({ title, sub }) => {
  const f = useFadeIn();
  return (
    <div ref={f.ref} style={{ textAlign: "center", marginBottom: 48, ...f.style }}>
      <h2 style={{ fontFamily: T.font, fontSize: "clamp(26px,4vw,36px)", fontWeight: 800, color: T.text, margin: 0, lineHeight: 1.2 }}>{title}</h2>
      {sub && <p style={{ fontFamily: T.font, fontSize: 16, color: T.textMd, margin: "12px auto 0", maxWidth: 560, lineHeight: 1.6 }}>{sub}</p>}
    </div>
  );
};

/* ══════════════════════════════════════════════
   MAIN APP
   ══════════════════════════════════════════════ */
export default function HappyBuzzComingSoon() {
  const [selectedTier, setSelectedTier] = useState(1);
  const [page, setPage] = useState("home");
  const [heroSlide, setHeroSlide] = useState(0);
  const heroImages = ["/Happybuzz_Ad_Camera.png", "/Happybuzz_Ad_Gameboy.png", "/Happybuzz_Ad_Vinyl.png"];
  useEffect(() => {
    const timer = setInterval(() => setHeroSlide((s) => (s + 1) % 3), 4500);
    return () => clearInterval(timer);
  }, []);
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(() => {
    try { return localStorage.getItem("hb_wl_done") === "1"; }
    catch (e) { return false; }
  });

  /* Persist submitted state */
  useEffect(() => {
    if (waitlistSubmitted) { try { localStorage.setItem("hb_wl_done", "1"); } catch (e) {} }
  }, [waitlistSubmitted]);

  /* Navigate to subpage and scroll to top */
  const goTo = (p) => { setPage(p); window.scrollTo({ top: 0, behavior: "instant" }); };

  /* Email input with native form POST to Mailchimp via hidden iframe */
  const EmailInput = ({ variant = "default" }) => {
    const [localEmail, setLocalEmail] = useState("");

    if (waitlistSubmitted) {
      return (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: T.greenSoft, borderRadius: T.rSm, padding: "14px 24px", color: T.green, fontWeight: 700, fontSize: 15, fontFamily: T.font }}>
          {Icons.check} Du bist dabei! Wir melden uns mit den nächsten happybuzz.-Updates.
        </div>
      );
    }

    return (
      <form
        action={MC.action}
        method="POST"
        target="mc-iframe"
        onSubmit={() => { setTimeout(() => setWaitlistSubmitted(true), 800); }}
        style={{ margin: 0 }}
      >
        <input type="hidden" name="u" value={MC.u} />
        <input type="hidden" name="id" value={MC.id} />
        <div style={{ display: "flex", gap: 8, maxWidth: 440, margin: variant === "center" ? "0 auto" : undefined, flexWrap: "wrap" }}>
          <input
            name="EMAIL"
            type="email"
            required
            value={localEmail}
            onChange={(e) => setLocalEmail(e.target.value)}
            placeholder="deine@email.ch"
            style={{
              flex: 1, minWidth: 200, padding: "14px 18px", borderRadius: T.rSm, border: `1.5px solid ${T.border}`,
              fontSize: 15, outline: "none", fontFamily: T.font, boxSizing: "border-box", background: T.surface,
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = T.honey)}
            onBlur={(e) => (e.target.style.borderColor = T.border)}
          />
          <button
            type="submit"
            style={{
              padding: "14px 28px", borderRadius: T.rSm, border: "none", background: T.honey, color: T.dark,
              fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: T.font, whiteSpace: "nowrap",
              transition: "background 0.2s, transform 0.15s", letterSpacing: "-0.01em",
            }}
            onMouseEnter={(e) => { e.target.style.background = T.honeyHover; e.target.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.target.style.background = T.honey; e.target.style.transform = "translateY(0)"; }}
          >
            Auf die Warteliste →
          </button>
        </div>
        <div style={{ position: "absolute", left: "-5000px" }} aria-hidden="true">
          <input type="text" name={`b_${MC.u}_${MC.id}`} tabIndex="-1" defaultValue="" />
        </div>
      </form>
    );
  };

  /* Fee tiers */
  const tiers = [
    { pct: 3, label: "Fair", desc: "Deckt die Plattformkosten" },
    { pct: 5, label: "Supporter", desc: "Empfohlen" },
    { pct: 7, label: "Impact", desc: "Starker Beitrag" },
    { pct: 10, label: "Hero", desc: "Maximaler Impact" },
  ];

  const sel = tiers[selectedTier];
  const exampleAmount = 100;
  const fee = (exampleAmount * sel.pct) / 100;
  const beeFee = (fee * 0.2).toFixed(2);

  /* ── RENDER ── */
  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: T.font, color: T.text, overflowX: "hidden" }}>
      <FontLoader />

      {/* Persistent hidden iframe for Mailchimp — lives outside all components, never re-renders */}
      <iframe name="mc-iframe" id="mc-iframe" style={{ display: "none" }} tabIndex="-1" aria-hidden="true" />

      {/* ═══ GLOBAL STYLES ═══ */}
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: ${T.bg}; }
        ::selection { background: ${T.honeySoft}; color: ${T.dark}; }
        input::placeholder { color: ${T.textLt}; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; text-align: center !important; }
          .hero-cards { max-width: 400px; margin: 0 auto; }
          .compare-grid { grid-template-columns: 1fr !important; }
          .usp-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .steps-grid { grid-template-columns: 1fr !important; }
          .fee-layout { grid-template-columns: 1fr !important; }
          .nav-logo { height: 32px !important; }
        }
        @media (max-width: 480px) {
          .hero-ctas { flex-direction: column !important; align-items: stretch !important; }
          .usp-grid { grid-template-columns: 1fr !important; }
          .nav-logo { height: 28px !important; }
        }
      `}</style>

      {/* ═══ NAV ═══ */}
      <nav style={{ padding: "16px 24px", display: "flex", justifyContent: "center", alignItems: "center", position: "sticky", top: 0, background: `${T.bg}ee`, backdropFilter: "blur(12px)", zIndex: 100, borderBottom: `1px solid ${T.borderLt}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 1200, width: "100%", gap: 16 }}>
          <img src={LOGO_URI} alt="happybuzz" className="nav-logo" style={{ height: 36, width: "auto", cursor: "pointer" }} onClick={() => goTo("home")} />
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.textMd, letterSpacing: "0.04em", textTransform: "uppercase" }}>Pre-Launch Schweiz</span>
            <button
              onClick={() => document.getElementById("warteliste")?.scrollIntoView({ behavior: "smooth" })}
              style={{
                padding: "9px 20px", borderRadius: T.rSm, border: "none", background: T.honey, color: T.dark,
                fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: T.font, transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.background = T.honeyHover)}
              onMouseLeave={(e) => (e.target.style.background = T.honey)}
            >
              Zur Warteliste
            </button>
          </div>
        </div>
      </nav>

      <main style={{ display: page === "home" ? "block" : "none" }}>

        {/* ═══════════════════════════
           HERO
           ═══════════════════════════ */}
        <section style={{ padding: "72px 24px 64px", background: `linear-gradient(180deg, ${T.bg} 0%, ${T.honeySoft} 100%)` }}>
          <div className="hero-grid" style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 580px", gap: 48, alignItems: "center" }}>

            {/* LEFT — Content */}
            <div style={{ animation: "fadeUp 0.7s ease" }}>
              {/* Badge */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 99,
                background: T.surface, border: `1.5px solid ${T.border}`, marginBottom: 24,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.green, display: "inline-block", animation: "pulse 2s ease infinite" }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: T.textMd, letterSpacing: "0.01em" }}>Warteliste geöffnet — bald in der Schweiz</span>
              </div>

              {/* Headline */}
              <h1 style={{
                fontFamily: T.font, fontSize: "clamp(36px, 5.5vw, 56px)", fontWeight: 800,
                lineHeight: 1.08, letterSpacing: "-0.035em", color: T.dark, marginBottom: 20,
              }}>
                Kaufen, verkaufen
                <br />
                <span style={{ color: T.honey }}>und Gutes</span> bewirken.
              </h1>

              {/* Subheadline */}
              <p style={{ fontSize: 18, lineHeight: 1.6, color: T.textMd, maxWidth: 480, marginBottom: 32 }}>
                happybuzz. ist der neue Schweizer Marktplatz — mit Festpreis und Auktion. Du wählst deinen Plattformbeitrag selbst, und ein Teil davon geht an ein gutes Projekt.
              </p>

              {/* CTA Buttons */}
              <div className="hero-ctas" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
                <button
                  onClick={() => document.getElementById("warteliste")?.scrollIntoView({ behavior: "smooth" })}
                  style={{
                    padding: "16px 32px", borderRadius: T.rSm, border: "none", background: T.honey, color: T.dark,
                    fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: T.font,
                    boxShadow: `0 4px 20px ${T.honeyGlow}`, transition: "all 0.2s", letterSpacing: "-0.01em",
                  }}
                  onMouseEnter={(e) => { e.target.style.background = T.honeyHover; e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = `0 8px 30px rgba(244,192,63,0.25)`; }}
                  onMouseLeave={(e) => { e.target.style.background = T.honey; e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = `0 4px 20px ${T.honeyGlow}`; }}
                >
                  Zur Warteliste →
                </button>
                <button
                  onClick={() => document.getElementById("so-funktionierts")?.scrollIntoView({ behavior: "smooth" })}
                  style={{
                    padding: "16px 24px", borderRadius: T.rSm, border: `1.5px solid ${T.border}`, background: "transparent",
                    color: T.textMd, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: T.font, transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => { e.target.style.borderColor = T.honey; e.target.style.color = T.dark; }}
                  onMouseLeave={(e) => { e.target.style.borderColor = T.border; e.target.style.color = T.textMd; }}
                >
                  So funktioniert's
                </button>
              </div>

              {/* Trust line */}
              <p style={{ fontSize: 13, color: T.textLt, marginTop: 4 }}>Kein Spam. Nur Launch-Updates und früher Zugang.</p>
            </div>

            {/* RIGHT — Preview Cards */}
            {/* RIGHT — Image Carousel */}
            <div className="hero-cards" style={{ animation: "fadeUp 0.7s ease 0.2s both", position: "relative" }}>
              <div style={{
                borderRadius: T.rLg, overflow: "hidden", position: "relative",
                boxShadow: "0 8px 40px rgba(0,0,0,0.10)", aspectRatio: "4/3",
              }}>
                {heroImages.map((src, i) => (
                  <img
                    key={src}
                    src={src}
                    alt={["Kamera", "Gameboy", "Vinyl"][i]}
                    style={{
                      position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                      objectFit: "cover", opacity: heroSlide === i ? 1 : 0,
                      transition: "opacity 0.8s ease",
                    }}
                  />
                ))}
              </div>
              {/* Dots */}
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
                {heroImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setHeroSlide(i)}
                    style={{
                      width: heroSlide === i ? 24 : 8, height: 8, borderRadius: 99,
                      background: heroSlide === i ? T.honey : T.border, border: "none",
                      cursor: "pointer", transition: "all 0.3s ease", padding: 0,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════
           USP CARDS
           ═══════════════════════════ */}
        <Section bg={T.bg}>
          <SectionHeading title="Ein Marktplatz mit gutem Gefühl." sub="Fair handeln, transparent beitragen, Gutes bewirken." />
          <div className="usp-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {[
              { icon: Icons.tag, title: "Du wählst fair", text: "Statt fixer Gebühren bestimmst du deinen Plattformbeitrag ab 3 % selbst.", accent: T.honeySoft, border: T.honey },
              { icon: Icons.shield, title: "Transparent & ehrlich", text: "Du siehst genau wohin dein Beitrag fliesst — keine versteckten Kosten, keine Überraschungen.", accent: T.greenSoft, border: T.green },
              { icon: Icons.store, title: "Mehr als verkaufen", text: "Kaufen und verkaufen zum Start — mieten und vermieten ist als nächster Schritt geplant.", accent: T.blueSoft, border: T.blue },
              { icon: Icons.mapPin, title: "Für die Schweiz", text: "Lokal gedacht, einfach gemacht und fairer aufgebaut.", accent: T.greenSoft, border: T.green },
            ].map((c, i) => (
                <div key={i} style={{
                  background: T.surface, borderRadius: T.r, padding: "28px 24px", border: `1px solid ${T.borderLt}`,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.03)", transition: "transform 0.25s, box-shadow 0.25s", cursor: "default",
                  animation: `fadeUp 0.6s ease ${i * 100}ms both`,
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.07)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.03)"; }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: c.accent, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>{c.icon}</div>
                  <h3 style={{ fontFamily: T.font, fontSize: 17, fontWeight: 800, color: T.dark, marginBottom: 8, letterSpacing: "-0.01em" }}>{c.title}</h3>
                  <p style={{ fontFamily: T.font, fontSize: 14, color: T.textMd, lineHeight: 1.55 }}>{c.text}</p>
                </div>
            ))}
          </div>
        </Section>

        {/* ═══════════════════════════
           SO FUNKTIONIERT'S
           ═══════════════════════════ */}
        <Section id="so-funktionierts" bg={T.warm}>
          <SectionHeading title="So funktioniert happybuzz." />
          <div className="steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {[
              { num: "1", title: "Anbieten", text: "Erstelle dein Inserat für Verkauf, Auktion oder später auch Vermietung.", icon: "clipboard" },
              { num: "2", title: "Beitrag wählen", text: "Du bestimmst deinen fairen Plattformbeitrag ab 3 % selbst.", icon: "sliders" },
              { num: "3", title: "Gutes bewirken", text: "Ein Teil deines Plattformbeitrags fliesst in ein nachhaltiges Projekt — aktuell Bienenschutz.", icon: "sprout" },
            ].map((s, i) => (
                <div key={i} style={{
                  background: T.surface, borderRadius: T.r, padding: "32px 28px", textAlign: "center",
                  border: `1px solid ${T.borderLt}`, boxShadow: "0 2px 12px rgba(0,0,0,0.03)", position: "relative",
                  animation: `fadeUp 0.6s ease ${i * 120}ms both`,
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: "50%", background: s.icon === "sprout" ? T.greenSoft : T.honeySoft,
                    display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
                  }}>
                    {Icons[s.icon](26)}
                  </div>
                  <span style={{ position: "absolute", top: 16, left: 20, fontSize: 12, fontWeight: 800, color: T.textLt }}>0{s.num}</span>
                  <h3 style={{ fontFamily: T.font, fontSize: 18, fontWeight: 800, color: T.dark, marginBottom: 8 }}>{s.title}</h3>
                  <p style={{ fontFamily: T.font, fontSize: 14, color: T.textMd, lineHeight: 1.55 }}>{s.text}</p>
                </div>
            ))}
          </div>
        </Section>

        {/* ═══════════════════════════
           ZWISCHEN-CTA
           ═══════════════════════════ */}
        <div style={{ padding: "40px 24px", textAlign: "center", background: T.warm }}>
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <p style={{ fontFamily: T.font, fontSize: 22, fontWeight: 800, color: T.dark, marginBottom: 8, letterSpacing: "-0.02em" }}>Klingt fair?</p>
            <p style={{ fontFamily: T.font, fontSize: 15, color: T.textMd, marginBottom: 20, lineHeight: 1.55 }}>Dann trag dich ein und hilf mit, happybuzz. von Anfang an aufzubauen.</p>
            <button
              onClick={() => document.getElementById("warteliste")?.scrollIntoView({ behavior: "smooth" })}
              style={{
                padding: "14px 28px", borderRadius: T.rSm, border: "none", background: T.honey, color: T.dark,
                fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: T.font, transition: "all 0.2s",
                boxShadow: `0 4px 16px ${T.honeyGlow}`,
              }}
              onMouseEnter={(e) => { e.target.style.background = T.honeyHover; e.target.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.target.style.background = T.honey; e.target.style.transform = "translateY(0)"; }}
            >
              Zur Warteliste →
            </button>
          </div>
        </div>

        {/* ═══════════════════════════
           GEBÜHRENMODELL
           ═══════════════════════════ */}
        <Section bg={T.bg}>
          <SectionHeading title="Du entscheidest, was fair ist." sub="Bei happybuzz. wählst du deinen Plattformbeitrag selbst — ab 3 %. So bleibt die Plattform tragfähig, transparent und fair." />

          <div className="fee-layout" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, maxWidth: 860, margin: "0 auto" }}>
            {/* Tier selector */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {tiers.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedTier(i)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "16px 20px", borderRadius: T.rSm,
                    border: selectedTier === i ? `2px solid ${T.honey}` : `1.5px solid ${T.border}`,
                    background: selectedTier === i ? T.honeySoft : T.surface,
                    cursor: "pointer", fontFamily: T.font, transition: "all 0.2s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: selectedTier === i ? T.honey : T.warm,
                      color: selectedTier === i ? T.dark : T.textMd,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 800, fontSize: 14, flexShrink: 0,
                    }}>
                      {t.pct}%
                    </span>
                    <div style={{ textAlign: "left" }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: T.dark, margin: 0 }}>{t.label}</p>
                      <p style={{ fontSize: 12, color: T.textLt, margin: 0 }}>{t.desc}</p>
                    </div>
                  </div>
                  {i === 1 && <span style={{ fontSize: 10, fontWeight: 700, color: T.honey, background: T.surface, border: `1px solid ${T.honey}`, padding: "2px 8px", borderRadius: 99 }}>Empfohlen</span>}
                </button>
              ))}
              {/* Eigener Beitrag */}
              <div style={{
                display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderRadius: T.rSm,
                border: `1.5px dashed ${T.border}`, background: T.surface,
              }}>
                <span style={{ width: 36, height: 36, borderRadius: "50%", background: T.warm, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: T.textLt, flexShrink: 0 }}>…</span>
                <p style={{ fontSize: 14, fontWeight: 600, color: T.textMd, margin: 0 }}>Eigener Beitrag ab 3 %</p>
              </div>
            </div>

            {/* Example calculation */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ background: T.surface, borderRadius: T.r, padding: 28, border: `1px solid ${T.borderLt}`, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: T.textLt, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 20 }}>Beispielrechnung</p>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                  <span style={{ fontSize: 14, color: T.textMd }}>Verkaufspreis</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: T.dark }}>CHF {exampleAmount}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                  <span style={{ fontSize: 14, color: T.textMd }}>Dein Beitrag ({sel.pct} %)</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: T.honey }}>CHF {fee.toFixed(2)}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8, paddingLeft: 12 }}>
                  <span style={{ fontSize: 13, color: T.green, fontStyle: "italic" }}>Davon für gutes Projekt</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.green }}>ca. CHF {beeFee}</span>
                </div>

                <div style={{ height: 1, background: T.border, margin: "14px 0" }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 14, color: T.textMd }}>Du erhältst</span>
                  <span style={{ fontSize: 22, fontWeight: 800, color: T.green }}>CHF {(exampleAmount - fee).toFixed(2)}</span>
                </div>

                <div style={{ marginTop: 16, padding: "10px 14px", background: T.greenSoft, borderRadius: T.rSm }}>
                  <p style={{ fontSize: 12, color: T.green, margin: 0, lineHeight: 1.5 }}>Aktuell unterstützt dieser Anteil Schweizer Bienenschutz.</p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════
           VERGLEICH
           ═══════════════════════════ */}
        <Section bg={T.warm}>
          <SectionHeading title="Warum happybuzz.?" sub="Ein Marktplatz, der anders denkt." />
          <div className="compare-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 720, margin: "0 auto" }}>
            {/* Andere */}
            <div style={{ background: T.surface, borderRadius: T.r, padding: "28px 24px", border: `1px solid ${T.borderLt}` }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.textLt, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 20 }}>Herkömmliche Plattformen</p>
              {["Feste Gebührenmodelle", "Wenig Mitbestimmung", "Kein direkter Impact", "Oft schwer nachvollziehbar"].map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < 3 ? `1px solid ${T.borderLt}` : "none" }}>
                  {Icons.x}
                  <span style={{ fontSize: 14, color: T.textMd }}>{t}</span>
                </div>
              ))}
            </div>

            {/* happybuzz. */}
            <div style={{ background: T.surface, borderRadius: T.r, padding: "28px 24px", border: `2px solid ${T.honey}`, boxShadow: `0 4px 20px ${T.honeyGlow}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: T.honey, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>happybuzz.</p>
                <span style={{ fontSize: 10, fontWeight: 700, color: T.dark, background: T.honeySoft, padding: "2px 8px", borderRadius: 99 }}>Fairer</span>
              </div>
              {["Beitrag selbst wählen", "Transparentes Modell", "Ein Teil geht an nachhaltige Projekte", "Kaufen, verkaufen und später vermieten"].map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < 3 ? `1px solid ${T.borderLt}` : "none" }}>
                  {Icons.checkSmall}
                  <span style={{ fontSize: 14, color: T.dark, fontWeight: 600 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════
           WARTELISTEN-BOX
           ═══════════════════════════ */}
        <Section id="warteliste" bg={T.bg}>
          <div style={{
            maxWidth: 640, margin: "0 auto", textAlign: "center", background: T.surface,
            borderRadius: T.rLg, padding: "48px 36px", border: `1px solid ${T.borderLt}`,
            boxShadow: "0 8px 40px rgba(0,0,0,0.06)", position: "relative", overflow: "hidden",
          }}>
            {/* Decorative top bar */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${T.honey}, ${T.green})` }} />

            <h2 style={{ fontFamily: T.font, fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 800, color: T.dark, marginBottom: 12, letterSpacing: "-0.02em" }}>
              Sei von Anfang an dabei.
            </h2>

            <p style={{ fontFamily: T.font, fontSize: 16, color: T.textMd, lineHeight: 1.6, maxWidth: 460, margin: "0 auto 28px" }}>
              Hilf mit, einen faireren Schweizer Marktplatz aufzubauen. Trag dich ein und erfahre als Erste:r, wann happybuzz. startet.
            </p>

            <EmailInput variant="center" />

            <p style={{ fontSize: 12, color: T.textLt, marginTop: 16 }}>Kein Spam. Abmeldung jederzeit möglich.</p>
            <p style={{ fontSize: 11, color: T.textLt, marginTop: 4 }}>Wir nutzen deine E-Mail nur für Updates zum Start von happybuzz.</p>
          </div>
        </Section>

        {/* ═══════════════════════════
           FAQ / TRUST AREA
           ═══════════════════════════ */}
        <Section bg={T.warm} style={{ paddingBottom: 40 }}>
          <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
            <p style={{ fontSize: 14, color: T.textMd, lineHeight: 1.7, fontFamily: T.font }}>
              happybuzz. wird gerade aufgebaut. Ein fairer Schweizer Marktplatz für Kaufen und Verkaufen — mit Festpreis und Auktion, selbstgewähltem Plattformbeitrag und dem Anspruch, mehr zurückzugeben als nur eine Plattform.
            </p>
            <p style={{ fontSize: 13, color: T.textLt, marginTop: 12, fontFamily: T.font }}>Fragen? Schreib uns an <span style={{ color: T.honey, fontWeight: 600 }}>hello@happybuzz.ch</span></p>
          </div>
        </Section>

      </main>

      {/* ═══════════════════════════════════════
         SUBPAGES — Datenschutz, Impressum, Bienenschutz
         ═══════════════════════════════════════ */}
      {page !== "home" && (
        <div style={{ minHeight: "60vh", padding: "48px 24px 64px", background: page === "impressum" ? T.warm : T.bg }}>
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            {/* Back button */}
            <button
              onClick={() => goTo("home")}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: T.rSm,
                border: `1.5px solid ${T.border}`, background: T.surface, color: T.textMd, fontSize: 13,
                fontWeight: 600, cursor: "pointer", fontFamily: T.font, marginBottom: 32, transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.honey; e.currentTarget.style.color = T.dark; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMd; }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
              Zurück zur Startseite
            </button>

            {/* ── DATENSCHUTZ ── */}
            {page === "datenschutz" && (
              <div>
                <h2 style={{ fontFamily: T.font, fontSize: 28, fontWeight: 800, color: T.dark, marginBottom: 24, letterSpacing: "-0.02em" }}>Datenschutz</h2>
                <div style={{ fontFamily: T.font, fontSize: 14, color: T.textMd, lineHeight: 1.75 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: T.dark, marginTop: 24, marginBottom: 8 }}>1. Verantwortliche Stelle</h3>
                  <p>Verantwortlich für die Datenverarbeitung auf dieser Website ist happybuzz. (siehe Impressum). Bei Fragen zum Datenschutz erreichst du uns unter <span style={{ color: T.honey, fontWeight: 600 }}>hello@happybuzz.ch</span>.</p>

                  <h3 style={{ fontSize: 17, fontWeight: 700, color: T.dark, marginTop: 24, marginBottom: 8 }}>2. Welche Daten wir erheben</h3>
                  <p>Aktuell erheben wir ausschliesslich deine E-Mail-Adresse, wenn du dich freiwillig auf unsere Warteliste einträgst. Wir nutzen diese E-Mail-Adresse nur, um dich über den Start und Neuigkeiten von happybuzz. zu informieren.</p>

                  <h3 style={{ fontSize: 17, fontWeight: 700, color: T.dark, marginTop: 24, marginBottom: 8 }}>3. Newsletter-Dienst</h3>
                  <p>Für den Versand unserer E-Mails verwenden wir Mailchimp (The Rocket Science Group LLC, USA). Mailchimp speichert deine E-Mail-Adresse und zeichnet auf, ob und wann E-Mails geöffnet werden. Weitere Informationen findest du in der Datenschutzerklärung von Mailchimp unter <span style={{ color: T.honey, fontWeight: 600 }}>mailchimp.com/legal/privacy</span>.</p>

                  <h3 style={{ fontSize: 17, fontWeight: 700, color: T.dark, marginTop: 24, marginBottom: 8 }}>4. Cookies & Tracking</h3>
                  <p>Diese Website verwendet keine Cookies und kein Tracking. Wir setzen keine Analyse-Tools wie Google Analytics ein.</p>

                  <h3 style={{ fontSize: 17, fontWeight: 700, color: T.dark, marginTop: 24, marginBottom: 8 }}>5. Hosting</h3>
                  <p>Diese Website wird über Vercel Inc. (USA) gehostet. Beim Aufruf der Seite werden technisch notwendige Serverdaten (z. B. IP-Adresse, Zeitpunkt des Zugriffs) kurzfristig verarbeitet.</p>

                  <h3 style={{ fontSize: 17, fontWeight: 700, color: T.dark, marginTop: 24, marginBottom: 8 }}>6. Deine Rechte</h3>
                  <p>Du kannst dich jederzeit von unserer Warteliste abmelden — über den Link in jeder E-Mail oder per Nachricht an hello@happybuzz.ch. Du hast das Recht auf Auskunft, Berichtigung und Löschung deiner Daten.</p>

                  <h3 style={{ fontSize: 17, fontWeight: 700, color: T.dark, marginTop: 24, marginBottom: 8 }}>7. Anwendbares Recht</h3>
                  <p>Es gilt das Schweizer Datenschutzgesetz (DSG). Gerichtsstand ist Luzern, Schweiz.</p>

                  <p style={{ marginTop: 24, fontSize: 12, color: T.textLt }}>Stand: Mai 2026</p>
                </div>
              </div>
            )}

            {/* ── IMPRESSUM ── */}
            {page === "impressum" && (
              <div>
                <h2 style={{ fontFamily: T.font, fontSize: 28, fontWeight: 800, color: T.dark, marginBottom: 24, letterSpacing: "-0.02em" }}>Impressum & Kontakt</h2>
                <div style={{ fontFamily: T.font, fontSize: 14, color: T.textMd, lineHeight: 1.75 }}>
                  <div style={{ background: T.surface, borderRadius: T.r, padding: 24, border: `1px solid ${T.borderLt}`, marginBottom: 24 }}>
                    <p style={{ fontWeight: 700, color: T.dark, marginBottom: 8 }}>happybuzz.</p>
                    <p>Denis Mihaljevic</p>
                    <p>Kriens, Schweiz</p>
                    <p style={{ marginTop: 12 }}>E-Mail: <span style={{ color: T.honey, fontWeight: 600 }}>hello@happybuzz.ch</span></p>
                    <p>Web: <span style={{ color: T.honey, fontWeight: 600 }}>happybuzz.ch</span></p>
                  </div>

                  <h3 style={{ fontSize: 17, fontWeight: 700, color: T.dark, marginTop: 24, marginBottom: 8 }}>Haftungsausschluss</h3>
                  <p>Die Inhalte dieser Website werden mit grösstmöglicher Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte übernehmen wir keine Gewähr. happybuzz. befindet sich aktuell im Aufbau — die Plattform ist noch nicht live.</p>

                  <h3 style={{ fontSize: 17, fontWeight: 700, color: T.dark, marginTop: 24, marginBottom: 8 }}>Urheberrecht</h3>
                  <p>Alle Inhalte und Gestaltungselemente dieser Website, insbesondere das Logo und die Marke happybuzz., sind urheberrechtlich geschützt. Eine Nutzung ohne ausdrückliche Genehmigung ist nicht gestattet.</p>

                  <p style={{ marginTop: 24, fontSize: 12, color: T.textLt }}>Stand: Mai 2026</p>
                </div>
              </div>
            )}

            {/* ── BIENENSCHUTZ-TRANSPARENZ ── */}
            {page === "bienenschutz" && (
              <div>
                <h2 style={{ fontFamily: T.font, fontSize: 28, fontWeight: 800, color: T.dark, marginBottom: 24, letterSpacing: "-0.02em" }}>Bienenschutz-Transparenz</h2>
                <div style={{ fontFamily: T.font, fontSize: 14, color: T.textMd, lineHeight: 1.75 }}>
                  <div style={{ background: T.greenSoft, borderRadius: T.r, padding: 24, border: `1px solid #D3E8D2`, marginBottom: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      {Icons.leaf}
                      <p style={{ fontSize: 16, fontWeight: 700, color: T.green, margin: 0 }}>Unser Versprechen</p>
                    </div>
                    <p style={{ color: T.textMd }}>Ein fester, transparenter Anteil jedes Plattformbeitrags fliesst direkt in Schweizer Bienenschutzprojekte. Nicht der gesamte Beitrag — aber ein klar definierter Teil davon.</p>
                  </div>

                  <h3 style={{ fontSize: 17, fontWeight: 700, color: T.dark, marginTop: 24, marginBottom: 8 }}>Wie es funktioniert</h3>
                  <p>Wenn du etwas auf happybuzz. verkaufst, wählst du deinen Plattformbeitrag selbst — ab 3 %. Von diesem Beitrag fliesst ein fester Anteil (aktuell rund 20 %) in den Bienenschutz. Der Rest finanziert den Betrieb der Plattform.</p>

                  <div style={{ background: T.surface, borderRadius: T.r, padding: 20, border: `1px solid ${T.borderLt}`, margin: "20px 0" }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: T.textLt, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Beispiel</p>
                    <p>Du verkaufst einen Artikel für CHF 100 und wählst 5 % Beitrag.</p>
                    <p style={{ marginTop: 8 }}>Dein Beitrag: <strong style={{ color: T.honey }}>CHF 5.00</strong></p>
                    <p>Davon für gutes Projekt: <strong style={{ color: T.green }}>ca. CHF 1.00</strong></p>
                    <p>Plattformbetrieb: <strong>ca. CHF 4.00</strong></p>
                  </div>

                  <h3 style={{ fontSize: 17, fontWeight: 700, color: T.dark, marginTop: 24, marginBottom: 8 }}>Wohin fliesst das Geld?</h3>
                  <p>Wir arbeiten daran, mit anerkannten Schweizer Bienenschutz-Organisationen zusammenzuarbeiten. Zum Launch werden wir hier transparent auflisten, welche Projekte unterstützt werden und wie viel bisher gespendet wurde.</p>

                  <h3 style={{ fontSize: 17, fontWeight: 700, color: T.dark, marginTop: 24, marginBottom: 8 }}>Warum Bienen?</h3>
                  <p>Bienen sind unverzichtbar für unsere Landwirtschaft und Biodiversität. In der Schweiz sind zahlreiche Wildbienenarten bedroht. Mit happybuzz. wollen wir zeigen, dass fairer Handel und ökologische Verantwortung zusammengehören — ohne grosse Worte, mit konkreten Taten.</p>

                  <h3 style={{ fontSize: 17, fontWeight: 700, color: T.dark, marginTop: 24, marginBottom: 8 }}>Transparenz-Versprechen</h3>
                  <p>Sobald happybuzz. live ist, werden wir regelmässig veröffentlichen:</p>
                  <div style={{ padding: "12px 0" }}>
                    {["Gesamtbetrag, der an Bienenschutzprojekte geflossen ist", "Welche Projekte und Organisationen unterstützt werden", "Wie der Anteil berechnet wird"].map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
                        {Icons.checkSmall}
                        <span style={{ fontSize: 14, color: T.textMd }}>{item}</span>
                      </div>
                    ))}
                  </div>

                  <p style={{ marginTop: 16, padding: "12px 16px", background: T.honeySoft, borderRadius: T.rSm, fontSize: 13, color: T.textMd }}>
                    happybuzz. befindet sich im Aufbau. Details zu Partnerorganisationen und genauen Beträgen folgen vor dem Launch. Bei Fragen: <span style={{ color: T.honey, fontWeight: 600 }}>hello@happybuzz.ch</span>
                  </p>

                  <p style={{ marginTop: 24, fontSize: 12, color: T.textLt }}>Stand: Mai 2026</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ FOOTER ═══ */}
      <footer style={{ borderTop: `1px solid ${T.border}`, padding: "28px 24px 24px", background: T.bg }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, maxWidth: 1080, margin: "0 auto" }}>
          <img src={LOGO_URI} alt="happybuzz" style={{ height: 24, width: "auto" }} />
          <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            <a onClick={() => goTo("datenschutz")} style={{ fontSize: 12, color: T.textLt, textDecoration: "none", fontFamily: T.font, transition: "color 0.2s", cursor: "pointer" }} onMouseEnter={(e) => e.target.style.color = T.textMd} onMouseLeave={(e) => e.target.style.color = T.textLt}>Datenschutz</a>
            <a onClick={() => goTo("impressum")} style={{ fontSize: 12, color: T.textLt, textDecoration: "none", fontFamily: T.font, transition: "color 0.2s", cursor: "pointer" }} onMouseEnter={(e) => e.target.style.color = T.textMd} onMouseLeave={(e) => e.target.style.color = T.textLt}>Impressum</a>
            <a onClick={() => goTo("bienenschutz")} style={{ fontSize: 12, color: T.textLt, textDecoration: "none", fontFamily: T.font, transition: "color 0.2s", cursor: "pointer" }} onMouseEnter={(e) => e.target.style.color = T.textMd} onMouseLeave={(e) => e.target.style.color = T.textLt}>Bienenschutz-Transparenz</a>
          </div>
          <p style={{ fontSize: 11, color: T.textLt, margin: 0, width: "100%", textAlign: "center", paddingTop: 12, borderTop: `1px solid ${T.borderLt}` }}>© 2026 happybuzz. — Made with care in Switzerland</p>
        </div>
      </footer>
    </div>
  );
}
