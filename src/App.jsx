import { useState, useEffect } from "react";

const T = {
  honey: "#F4C03F",
  honeyHover: "#E0AF2E",
  honeySoft: "#FDF6E3",
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
  radius: 14,
  rSm: 8,
  font: "'Plus Jakarta Sans', system-ui, sans-serif",
};

const LOGO_URI = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDc2LjQxIDE2OS4xIj4KICA8ZGVmcz4KICAgIDxzdHlsZT4KICAgICAgLmNscy0xIHsKICAgICAgICBmaWxsOiAjMDEwMTAxOwogICAgICB9CgogICAgICAuY2xzLTIgewogICAgICAgIGZpbGw6ICMxYTE3MTY7CiAgICAgIH0KCiAgICAgIC5jbHMtMyB7CiAgICAgICAgZmlsbDogI2Y0YzAzZTsKICAgICAgfQogICAgPC9zdHlsZT4KICA8L2RlZnM+CiAgPGc+CiAgICA8Y2lyY2xlIGNsYXNzPSJjbHMtMyIgY3g9Ijg0LjU0IiBjeT0iODQuNTQiIHI9Ijg0LjU0Ii8+CiAgICA8Zz4KICAgICAgPHBhdGggY2xhc3M9ImNscy0yIiBkPSJNMTQ1Ljc2LDgwLjc3Yy0zLjUyLTQuMTUtOC41Ni02LjctMTMuODMtNy0uMDYsMC0uMTIsMC0uMTksMHYtLjA2aC0xLjg2Yy0uMzksMC0uNzksMC0xLjIyLDAtLjQ4LDAtLjk2LDAtMS40MiwwaC0zLjM1Yy0uNzUsMC0xLjUsMC0yLjI1LDAtLjc2LDAtMS41MSwwLTIuMjcsMC0xLjMzLDAtMi40MiwwLTMuNDQuMDEtLjAyLDAtLjA0LDAtLjA1LDAtLjItLjAxLS41LS4wMy0uODUtLjAzLTMuOTEsMC02LjIzLDIuMDgtNy4yNywzLjMybC0xLjgzLDIuMTl2MS42MWMtLjQxLDEuODItLjQ5LDQuMTMtLjI4LDcuMjMuMDgsMS4xMy4yMywyLjgxLjUyLDQuNDEuMzgsMi4wOCwxLjA1LDQuNDYsMy4wNiw2LjMyLDIuOTMsMi43Miw1LjU5LDQuNzIsOC4zNiw2LjMsMy41NSwyLjAyLDcuMjgsMy4yOSwxMS4xMSwzLjc4LjkyLjEyLDEuODYuMTgsMi43Ny4xOCw0LjQ2LDAsOC43NS0xLjQyLDEyLjA2LTMuOTksMy42NS0yLjg0LDUuOTQtNi44OSw2LjQzLTExLjM5aDBjLjQ5LTQuNTEtMS4wMS05LjA3LTQuMjEtMTIuODRaTTE0Mi4xNiw5Mi43NmMtLjU5LDUuNDYtNi4wNyw5LjA4LTEyLjQ2LDguMjctNi4wNi0uNzctMTAuODEtNC4wNC0xNS4xMy04LjA1LTEuMDQtLjk1LTEuNTktMTAuMDEtLjc5LTEwLjk1LjY4LS44MiwyLjI2LS40OCwzLjIxLS41LDEuNzEtLjAyLDMuNDIuMDIsNS4xNC4wMyw0Ljc2LjAyLDEwLjMtLjg2LDE0LjU3LDEuNjksMy4yNywxLjk1LDUuODMsNS41OCw1LjQ2LDkuNTFaIi8+CiAgICAgIDxwYXRoIGNsYXNzPSJjbHMtMiIgZD0iTTYzLjE1LDgwLjc5di0xLjYxbC0xLjgzLTIuMTljLTEuMDQtMS4yNC0zLjM2LTMuMzItNy4yNy0zLjMyLS4zNSwwLS42NS4wMi0uODUuMDMtLjAyLDAtLjA0LDAtLjA1LDAtMS4wMSwwLTIuMS0uMDEtMy40NC0uMDEtLjc2LDAtMS41MSwwLTIuMjcsMC0uNzUsMC0xLjUsMC0yLjI1LDBoLTMuMzVjLS40NywwLS45NCwwLTEuNDIsMC0uNDMsMC0uODMsMC0xLjIyLDBoLTEuODZ2LjA2Yy0uMDYsMC0uMTIsMC0uMTksMC01LjI3LjMtMTAuMzIsMi44NS0xMy44Myw3LTMuMiwzLjc3LTQuNyw4LjMzLTQuMjEsMTIuODNoMGMuNDksNC41MiwyLjc4LDguNTYsNi40MywxMS40LDMuMzEsMi41Nyw3LjU5LDMuOTksMTIuMDYsMy45OS45MiwwLDEuODUtLjA2LDIuNzctLjE4LDMuODItLjQ5LDcuNTYtMS43NiwxMS4xMS0zLjc4LDIuNzctMS41OCw1LjQzLTMuNTgsOC4zNi02LjMsMi4wMS0xLjg2LDIuNjgtNC4yNCwzLjA2LTYuMzIuMy0xLjYuNDUtMy4yOC41Mi00LjQxLjIxLTMuMTEuMTMtNS40MS0uMjgtNy4yM1pNNTQuNTEsOTIuOThjLTQuMzIsNC4wMS05LjA3LDcuMjgtMTUuMTMsOC4wNS02LjM5LjgxLTExLjg3LTIuODEtMTIuNDYtOC4yNy0uMzctMy45NCwyLjItNy41Niw1LjQ2LTkuNTEsNC4yNy0yLjU1LDkuOC0xLjY2LDE0LjU3LTEuNjksMS43MSwwLDMuNDItLjA1LDUuMTQtLjAzLjk1LjAxLDIuNTItLjMyLDMuMjEuNS44Ljk1LjI1LDEwLS43OSwxMC45NVoiLz4KICAgICAgPHBhdGggY2xhc3M9ImNscy0yIiBkPSJNNTcuNzgsMzguNzdjLjEuMDkuMTkuMTUuMjIuMTctLjA1LS4wNC0uMS0uMDgtLjE1LS4xMi0uMDItLjAyLS4wNS0uMDMtLjA3LS4wNWgwWiIvPgogICAgICA8cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Ik03NC43Miw0Ni45NGMtNC4xOC03LjQ0LTkuMzgtMTUuNTktMTcuNzUtMTguNDktMS40My0yLjgzLTQuMzYtNC43OC03Ljc1LTQuNzgtNC44LDAtOC42OSwzLjg5LTguNjksOC42OXMzLjg5LDguNjksOC42OSw4LjY5YzIuNzksMCw1LjI3LTEuMzIsNi44Ni0zLjM3LjE2LjA5LjMyLjE3LjQ3LjI2LjQxLjI1LjguNTEsMS4xOS43OS4wMi4wMS4wMy4wMi4wNS4wMy0uMDQtLjA0LS4wOS0uMDgtLjEzLS4xMi4wNi4wNi4xMy4xMi4yMS4xNy4xNS4xMS4xOS4xNC4xNS4xMi4wNy4wNS4xNC4xMS4yLjE2Ljc3LjY0LDEuNSwxLjM0LDIuMTgsMi4wNy4zNS4zNy42OS43NiwxLjAyLDEuMTUuMTcuMi4zMy40Mi41MS42MiwwLDAsMCwwLC4wMS4wMS42My44NiwxLjI0LDEuNzIsMS44MSwyLjYxLDEuMjIsMS44OSwyLjMyLDMuODUsMy40Miw1LjgxLDEuMTIsMiw0LjAzLDIuODQsNiwxLjU3LDIuMDItMS4zLDIuNzgtMy44NiwxLjU3LTZoMFoiLz4KICAgICAgPHBhdGggY2xhc3M9ImNscy0yIiBkPSJNMTExLjM5LDM4Ljc3Yy0uMS4wOS0uMTkuMTUtLjIyLjE3LjA1LS4wNC4xLS4wOC4xNS0uMTIuMDItLjAyLjA1LS4wMy4wNy0uMDVaIi8+CiAgICAgIDxwYXRoIGNsYXNzPSJjbHMtMiIgZD0iTTExNC40Myw3Mi42MmMtLjItMy44OS0uODYtNy43My0yLjQ2LTExLjQ4LTEuOTQtNC41Ni01LjA4LTguNDUtOS4wNS0xMS40MWgwYy0uNTQtLjQtMS4xLS43OS0xLjY4LTEuMTUtLjg0LS41My0xLjcxLTEuMDEtMi42MS0xLjQ2LTEuMTMtLjU2LTIuMjktMS4wNC0zLjQ4LTEuNDVoMGMtMy40LTEuMTgtNi45OS0xLjc4LTEwLjU3LTEuNzloLS4wMWMtMS43OSwwLTMuNTkuMTYtNS4zNi40Ni0xLjc3LjMtMy41Mi43NC01LjIyLDEuMzNoMGMtMS4xOS40Mi0yLjM1LjktMy40OCwxLjQ2LS45LjQ0LTEuNzcuOTMtMi42MSwxLjQ2LS41OC4zNy0xLjE0Ljc1LTEuNjgsMS4xNWgwYy0zLjk3LDIuOTYtNy4xMSw2Ljg1LTkuMDUsMTEuNDEtMS42LDMuNzYtMi4yNSw3LjU5LTIuNDYsMTEuNDgtLjE5LDMuNjIuMDIsNy4yOC4yMywxMC45NmgwYy4wNS43OS4wOSwxLjU4LjEzLDIuMzcuMTMsMi41Mi4yMSw1LjA0LjI0LDcuNTdoMGMuMDQsMi43Ny4wMyw1LjU1LjAyLDguMzIsMCwxLjc2LS4wMiwzLjUyLS4wMyw1LjI4LS4wMSwzLjEyLjAyLDYuMy44MSw5LjMzLjc4LDIuOTgsMi40OSw1Ljk0LDQuMzMsOC4zOSwzLjE1LDQuMTgsNy42MSw3LjExLDEyLjYxLDguNjEsMy41NywxLjA2LDUuNTEsMyw3LjAyLDYuMTQuNTcsMS4xOS44NSwyLjQ4LDEuMzksMy42OS42MywxLjM5LDEuNDQsMi4xMywzLjAzLDIuMTRoLjEyYzEuNTksMCwyLjM5LS43NSwzLjAzLTIuMTQuNTQtMS4yLjgyLTIuNSwxLjM5LTMuNjksMS41MS0zLjE0LDMuNDUtNS4wOCw3LjAyLTYuMTQsNS0xLjUsOS40Ni00LjQyLDEyLjYxLTguNjEsMS44NC0yLjQ0LDMuNTUtNS40MSw0LjMzLTguMzkuOC0zLjAzLjgzLTYuMjEuODEtOS4zMywwLTEuNzYtLjAyLTMuNTItLjAzLTUuMjgtLjAxLTIuNzgtLjAyLTUuNTUuMDItOC4zMmgwYy4wNC0yLjUyLjExLTUuMDUuMjQtNy41Ny4wNC0uNzkuMDktMS41OC4xMy0yLjM3aDBjLjIxLTMuNjguNDItNy4zNC4yMy0xMC45NlpNNjMuNjIsODYuODJjLjE1LTQuODIsMC05LjY0LjA1LTE0LjQ2aDBjLjA4LTguODYsNi4xOS0xNy4zNiwxNC44NS0xOS43MiwyLjAxLS41NSw0LjA1LS44MSw2LjA2LS43OSwyLjAxLS4wMSw0LjA1LjI0LDYuMDYuNzksOC42NiwyLjM2LDE0Ljc2LDEwLjg2LDE0Ljg1LDE5LjcyaDBjLjA1LDQuODItLjEsOS42NC4wNSwxNC40Ni4wNywyLjA3LS42MiwyLjUzLTIuNTcsMi40OS02LjExLS4xMy0xMi4yNS0uMTktMTguMzgtLjE5aC0uMDFjLTYuMTMsMC0xMi4yNy4wNi0xOC4zOC4xOS0xLjk0LjA0LTIuNjQtLjQyLTIuNTctMi40OWgwWk04Ny40MiwxMjYuNTNjLS45My4wMy0xLjg4LjA2LTIuODQuMDYtLjk2LDAtMS45MS0uMDMtMi44NC0uMDYtNy4zNC0uMjMtMTQuMDEtNS4xMS0xNi4zOS0xMi4yNiw2LjQyLjQzLDEyLjgxLjQ5LDE5LjIzLjQ3LDYuNDIuMDIsMTIuODItLjA0LDE5LjIzLS40Ny0yLjM4LDcuMTUtOS4wNSwxMi4wMy0xNi4zOSwxMi4yNlpNMTA1LjU1LDEwNC42OGMwLDEuMDItLjg0LDEuODYtMS44NiwxLjg2aC0zOC4yMmMtMS4wMiwwLTEuODYtLjg0LTEuODYtMS44NnYtNC41OGMwLTEuMDIuODQtMS44NiwxLjg2LTEuODZoMzguMjJjMS4wMiwwLDEuODYuODQsMS44NiwxLjg2djQuNThaIi8+CiAgICAgIDxwYXRoIGNsYXNzPSJjbHMtMiIgZD0iTTExMS4zNywzOC43N3MtLjA1LjA0LS4wNy4wNWMtLjA1LjA0LS4xLjA4LS4xNS4xMi4wMy0uMDIuMTItLjA4LjIyLS4xN2gwWiIvPgogICAgICA8cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Ik05NC40Myw0Ni45NGgwYy0xLjIsMi4xNC0uNDUsNC42OSwxLjU3LDYsMS45NywxLjI3LDQuODcuNDMsNi0xLjU3LDEuMS0xLjk2LDIuMi0zLjkyLDMuNDItNS44MS41Ny0uODksMS4xOC0xLjc2LDEuODEtMi42MSwwLDAsMCwwLC4wMS0uMDEuMTctLjIuMzQtLjQxLjUxLS42Mi4zMy0uMzkuNjctLjc3LDEuMDItMS4xNS42OS0uNzMsMS40MS0xLjQyLDIuMTgtMi4wNy4wNi0uMDUuMTMtLjExLjItLjE2LS4wNC4wMiwwLS4wMS4xNS0uMTIuMDctLjA2LjE0LS4xMS4yMS0uMTctLjA1LjA0LS4wOS4wOC0uMTMuMTIuMDItLjAxLjAzLS4wMi4wNS0uMDMuMzktLjI4Ljc4LS41NCwxLjE5LS43OS4xNS0uMDkuMzEtLjE3LjQ3LS4yNiwxLjU5LDIuMDUsNC4wNywzLjM3LDYuODYsMy4zNyw0LjgsMCw4LjY5LTMuODksOC42OS04LjY5cy0zLjg5LTguNjktOC42OS04LjY5Yy0zLjM5LDAtNi4zMiwxLjk1LTcuNzUsNC43OC04LjM3LDIuOS0xMy41NywxMS4wNS0xNy43NSwxOC40OWgwWiIvPgogICAgICA8cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Ik01Ny43NywzOC43N2MuMS4wOS4xOS4xNS4yMi4xNy0uMDUtLjA0LS4xLS4wOC0uMTUtLjEyLS4wMi0uMDItLjA1LS4wMy0uMDctLjA1WiIvPgogICAgICA8cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Ik0xMTEuMzksMzguNzdjLS4xLjA5LS4xOS4xNS0uMjIuMTcuMDUtLjA0LjEtLjA4LjE1LS4xMi4wMi0uMDIuMDUtLjAzLjA3LS4wNVoiLz4KICAgICAgPHBhdGggY2xhc3M9ImNscy0yIiBkPSJNOTMuNSw4NC40MWMtMy4yMSwzLjQ4LTE0LjQ2LDMuMzgtMTcuNzItLjExLTEuMDktMS4xNy0xLjkyLTIuNDYtMS4xNy00LjA5LjY3LTEuNDMsMS45Ny0xLjc3LDMuNS0xLjcxLDIuMjguMDgsNC41Ni4wMiw2Ljg0LjAydi4wNWg2LjA5YzEuNDQsMCwyLjgzLjE1LDMuNSwxLjcxLjcxLDEuNjQuMDIsMi45OS0xLjA0LDQuMTVaIi8+CiAgICAgIDxwYXRoIGNsYXNzPSJjbHMtMiIgZD0iTTg5LjIyLDczLjg1Yy0yLjk2LTIuOTYtMi45Ni03Ljc1LDAtMTAuNywyLjk2LTIuOTYsNy43NS0yLjk2LDEwLjcsMHMyLjk2LDcuNzUsMCwxMC43LTcuNzUsMi45Ni0xMC43LDBaIi8+CiAgICAgIDxwYXRoIGNsYXNzPSJjbHMtMiIgZD0iTTY5LjI0LDczLjg1Yy0yLjk2LTIuOTYtMi45Ni03Ljc1LDAtMTAuNywyLjk2LTIuOTYsNy43NS0yLjk2LDEwLjcsMCwyLjk2LDIuOTYsMi45Niw3Ljc1LDAsMTAuN3MtNy43NSwyLjk2LTEwLjcsMFoiLz4KICAgIDwvZz4KICA8L2c+CiAgPGc+CiAgICA8cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0yMTguNDcsMjkuOGgyNi4yN3YxMDkuNDloLTI2LjI3VjI5LjhaTTI3My45Niw5Ni4zNWMwLTQuNTItMS4yMy04LjEyLTMuNjktMTAuNzctMi40Ni0yLjY2LTUuNzYtMy45OC05Ljg5LTMuOTgtNC44Mi4xLTguNjMsMS44NC0xMS40NCw1LjI0LTIuOCwzLjM5LTQuMjEsNy43NS00LjIxLDEzLjA2aC02LjM1YzAtOS4wNSwxLjMzLTE2LjY1LDMuOTgtMjIuOCwyLjY2LTYuMTUsNi40NC0xMC43OSwxMS4zNi0xMy45NCw0LjkyLTMuMTUsMTAuNzItNC43MiwxNy40MS00LjcyLDUuOSwwLDExLjAyLDEuMjUsMTUuMzUsMy43Niw0LjMzLDIuNTEsNy43LDYuMDUsMTAuMTEsMTAuNjIsMi40MSw0LjU4LDMuNjIsOS45NiwzLjYyLDE2LjE2djUwLjMyaC0yNi4yN3YtNDIuOTRaIi8+CiAgICA8cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0zNDcuNDQsMTA1LjM1Yy0zLjc0LDAtNi41Mi42Ni04LjM0LDEuOTktMS44MiwxLjMzLTIuNzMsMy40Mi0yLjczLDYuMjdzLjkzLDUuMDksMi44LDYuNzFjMS44NywxLjYyLDQuNTIsMi40Myw3Ljk3LDIuNDMsMi42NiwwLDUuMDktLjQ0LDcuMy0xLjMzLDIuMjEtLjg5LDQuMDgtMi4xNCw1LjYxLTMuNzYsMS41Mi0xLjYyLDIuNTMtMy40NywzLjAzLTUuNTNsMy42OSwxMS42NmMtMi4xNyw1LjQxLTUuNjEsOS41NC0xMC4zMywxMi40LTQuNzIsMi44NS0xMC41Myw0LjI4LTE3LjQxLDQuMjgtNS43MSwwLTEwLjYtMS4wOC0xNC42OC0zLjI1LTQuMDgtMi4xNi03LjIxLTUuMTEtOS4zNy04Ljg1LTIuMTctMy43NC0zLjI1LTguMDItMy4yNS0xMi44NCwwLTcuNTcsMi42My0xMy40OCw3Ljg5LTE3LjcxLDUuMjYtNC4yMywxMi44MS02LjM5LDIyLjY1LTYuNDloMjMuMzJ2MTQuMDJoLTE4LjE1Wk0zNjMuMDgsOTAuNDVjMC0zLjg0LTEuMjgtNi44NC0zLjg0LTktMi41Ni0yLjE2LTYuMzUtMy4yNS0xMS4zNi0zLjI1LTMuMzUsMC03LjA4LjU0LTExLjIxLDEuNjItNC4xMywxLjA4LTguMzYsMi43MS0xMi42OSw0Ljg3bC03LjIzLTE3LjQxYzQuMjMtMS44Nyw4LjM0LTMuNDcsMTIuMzItNC44LDMuOTgtMS4zMyw4LjA0LTIuMzQsMTIuMTctMy4wMyw0LjEzLS42OSw4LjM2LTEuMDMsMTIuNjktMS4wMywxMS4xMiwwLDE5LjcsMi41MywyNS43NSw3LjYsNi4wNSw1LjA3LDkuMTIsMTIuMTcsOS4yMiwyMS4zMnY1MS45NGgtMjUuODJ2LTQ4Ljg0WiIvPgogICAgPHBhdGggY2xhc3M9ImNscy0xIiBkPSJNNDA3LjM1LDU5LjYxaDI2LjI3djEwOC4zMWgtMjYuMjdWNTkuNjFaTTQ1Ny4wOCw1OC43MmM3LjQ3LDAsMTMuOTksMS43LDE5LjU1LDUuMDksNS41NiwzLjM5LDkuODksOC4xNywxMi45OSwxNC4zMSwzLjEsNi4xNSw0LjY1LDEzLjQxLDQuNjUsMjEuNzdzLTEuNSwxNS00LjUsMjEuMWMtMyw2LjEtNy4yMywxMC44Mi0xMi42OSwxNC4xNy01LjQ2LDMuMzUtMTEuOTMsNS4wMi0xOS40MSw1LjAyLTYuNjksMC0xMi40Ny0xLjY1LTE3LjM0LTQuOTQtNC44Ny0zLjI5LTguNjEtNy45Ny0xMS4yMS0xNC4wMi0yLjYxLTYuMDUtMy45MS0xMy4yMS0zLjkxLTIxLjQ3czEuMjgtMTUuNzYsMy44NC0yMS45MWMyLjU2LTYuMTUsNi4yMi0xMC44NywxMC45OS0xNC4xNyw0Ljc3LTMuMjksMTAuNDUtNC45NCwxNy4wNC00Ljk0Wk00NTAuNTksNzguOTRjLTMuMjUsMC02LjE3Ljg2LTguNzgsMi41OC0yLjYxLDEuNzItNC42Miw0LjA4LTYuMDUsNy4wOC0xLjQzLDMtMi4xNCw2LjUyLTIuMTQsMTAuNTVzLjcxLDcuNDUsMi4xNCwxMC41NWMxLjQyLDMuMSwzLjQ0LDUuNDksNi4wNSw3LjE2LDIuNjEsMS42Nyw1LjUzLDIuNTEsOC43OCwyLjUxLDMuNDQsMCw2LjQ3LS44Niw5LjA4LTIuNTgsMi42MS0xLjcyLDQuNjItNC4xMSw2LjA1LTcuMTYsMS40Mi0zLjA1LDIuMTQtNi41NCwyLjE0LTEwLjQ4cy0uNzEtNy40My0yLjE0LTEwLjQ4Yy0xLjQzLTMuMDUtMy40NS01LjQzLTYuMDUtNy4xNi0yLjYxLTEuNzItNS42My0yLjU4LTkuMDgtMi41OFoiLz4KICAgIDxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTUwOC41OCw1OS42MWgyNi4yN3YxMDguMzFoLTI2LjI3VjU5LjYxWk01NTguMzEsNTguNzJjNy40NywwLDEzLjk5LDEuNywxOS41NSw1LjA5LDUuNTYsMy4zOSw5Ljg5LDguMTcsMTIuOTksMTQuMzEsMy4xLDYuMTUsNC42NSwxMy40MSw0LjY1LDIxLjc3cy0xLjUsMTUtNC41LDIxLjFjLTMsNi4xLTcuMjMsMTAuODItMTIuNjksMTQuMTctNS40NiwzLjM1LTExLjkzLDUuMDItMTkuNDEsNS4wMi02LjY5LDAtMTIuNDctMS42NS0xNy4zNC00Ljk0LTQuODctMy4yOS04LjYxLTcuOTctMTEuMjEtMTQuMDItMi42MS02LjA1LTMuOTEtMTMuMjEtMy45MS0yMS40N3MxLjI4LTE1Ljc2LDMuODQtMjEuOTFjMi41Ni02LjE1LDYuMjItMTAuODcsMTAuOTktMTQuMTcsNC43Ny0zLjI5LDEwLjQ1LTQuOTQsMTcuMDQtNC45NFpNNTUxLjgyLDc4Ljk0Yy0zLjI1LDAtNi4xNy44Ni04Ljc4LDIuNTgtMi42MSwxLjcyLTQuNjIsNC4wOC02LjA1LDcuMDgtMS40MywzLTIuMTQsNi41Mi0yLjE0LDEwLjU1cy43MSw3LjQ1LDIuMTQsMTAuNTVjMS40MiwzLjEsMy40NCw1LjQ5LDYuMDUsNy4xNiwyLjYxLDEuNjcsNS41MywyLjUxLDguNzgsMi41MSwzLjQ0LDAsNi40Ny0uODYsOS4wOC0yLjU4LDIuNjEtMS43Miw0LjYyLTQuMTEsNi4wNS03LjE2LDEuNDItMy4wNSwyLjE0LTYuNTQsMi4xNC0xMC40OHMtLjcxLTcuNDMtMi4xNC0xMC40OGMtMS40My0zLjA1LTMuNDUtNS40My02LjA1LTcuMTYtMi42MS0xLjcyLTUuNjMtMi41OC05LjA4LTIuNThaIi8+CiAgICA8cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik02NDkuNjUsMTQ3LjI2Yy0yLjk1LDcuMzgtNy4wMywxMi44Ni0xMi4yNSwxNi40NS01LjIyLDMuNTktMTEuNTYsNS4zOS0xOS4wNCw1LjM5LTQuNTMsMC04LjY4LS42Ni0xMi40Ny0xLjk5LTMuNzktMS4zMy03LjUtMy40Mi0xMS4xNC02LjI3bDEwLjkyLTE3Ljg2YzMuNTQsMi45NSw3LjA4LDQuNDMsMTAuNjIsNC40MywyLjE2LDAsNC4wNi0uNTIsNS42OC0xLjU1LDEuNjItMS4wMywyLjkzLTIuNTgsMy45MS00LjY1bDEuOTItMy44NC0zMy4wNS03Ny43N2gyN2wxOS4wNCw1Mi4yNCwxNi45Ny01Mi4yNGgyNi4xMmwtMzQuMjQsODcuNjVaIi8+CiAgICA8cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik02OTMuNDgsMjkuOGgyNi4yN3YxMDkuNDloLTI2LjI3VjI5LjhaTTc0My4yMSw1OC43MmM3LjQ3LDAsMTMuOTksMS43LDE5LjU1LDUuMDksNS41NiwzLjM5LDkuODksOC4xNywxMi45OSwxNC4zMSwzLjEsNi4xNSw0LjY1LDEzLjQxLDQuNjUsMjEuNzdzLTEuNSwxNS00LjUsMjEuMWMtMyw2LjEtNy4yMywxMC44Mi0xMi42OSwxNC4xNy01LjQ2LDMuMzUtMTEuOTMsNS4wMi0xOS40MSw1LjAyLTYuNjksMC0xMi40Ny0xLjY1LTE3LjM0LTQuOTQtNC44Ny0zLjI5LTguNjEtNy45Ny0xMS4yMS0xNC4wMi0yLjYxLTYuMDUtMy45MS0xMy4yMS0zLjkxLTIxLjQ3czEuMjgtMTUuNzYsMy44NC0yMS45MWMyLjU2LTYuMTUsNi4yMi0xMC44NywxMC45OS0xNC4xNyw0Ljc3LTMuMjksMTAuNDUtNC45NCwxNy4wNC00Ljk0Wk03MzYuNzIsNzguOTRjLTMuMjUsMC02LjE3Ljg2LTguNzgsMi41OC0yLjYxLDEuNzItNC42Miw0LjA4LTYuMDUsNy4wOC0xLjQzLDMtMi4xNCw2LjUyLTIuMTQsMTAuNTVzLjcxLDcuNDUsMi4xNCwxMC41NWMxLjQyLDMuMSwzLjQ0LDUuNDksNi4wNSw3LjE2LDIuNjEsMS42Nyw1LjUzLDIuNTEsOC43OCwyLjUxLDMuNDQsMCw2LjQ3LS44Niw5LjA4LTIuNTgsMi42MS0xLjcyLDQuNjItNC4xMSw2LjA1LTcuMTYsMS40Mi0zLjA1LDIuMTQtNi41NCwyLjE0LTEwLjQ4cy0uNzEtNy40My0yLjE0LTEwLjQ4Yy0xLjQzLTMuMDUtMy40NS01LjQzLTYuMDUtNy4xNi0yLjYxLTEuNzItNS42My0yLjU4LTkuMDgtMi41OFoiLz4KICAgIDxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTgxNy44OCwxMDIuNTVjMCw0LjUzLDEuMTUsOC4xMiwzLjQ3LDEwLjc3LDIuMzEsMi42Niw1LjQzLDMuOTgsOS4zNywzLjk4LDQuNzItLjEsOC4zOS0xLjg3LDEwLjk5LTUuMzEsMi42MS0zLjQ0LDMuOTEtNy43NywzLjkxLTEyLjk5aDYuMmMwLDguOTUtMS4yOCwxNi41LTMuODQsMjIuNjUtMi41Niw2LjE1LTYuMiwxMC44LTEwLjkyLDEzLjk0LTQuNzIsMy4xNS0xMC4zOCw0LjcyLTE2Ljk3LDQuNzItNS43MSwwLTEwLjctMS4yNS0xNC45OC0zLjc2LTQuMjgtMi41MS03LjYtNi4wMy05Ljk2LTEwLjU1LTIuMzYtNC41Mi0zLjU0LTkuODktMy41NC0xNi4wOHYtNTAuMzJoMjYuMjd2NDIuOTRaTTg0NS42Miw1OS42MWgyNi4yN3Y3OS42OWgtMjYuMjdWNTkuNjFaIi8+CiAgICA8cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik04ODguMjYsNTkuNjFoNjkuOTV2MTUuNzlsLTM4LjM3LDQ0LjEyaDM5Ljg0djE5Ljc3aC03Mi43NXYtMTUuNzlsMzguMzctNDQuMTJoLTM3LjA0di0xOS43N1oiLz4KICAgIDxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTk3MC4xNiw1OS42MWg2OS45NXYxNS43OWwtMzguMzcsNDQuMTJoMzkuODR2MTkuNzdoLTcyLjc1di0xNS43OWwzOC4zNy00NC4xMmgtMzcuMDR2LTE5Ljc3WiIvPgogICAgPHBhdGggY2xhc3M9ImNscy0zIiBkPSJNMTA2My43MSwxMTUuMjRjMy43NCwwLDYuNzksMS4xNiw5LjE1LDMuNDcsMi4zNiwyLjMxLDMuNTQsNS4zNCwzLjU0LDkuMDhzLTEuMTgsNi43OS0zLjU0LDkuMTUtNS40MSwzLjU0LTkuMTUsMy41NC02LjY0LTEuMTgtOS0zLjU0Yy0yLjM2LTIuMzYtMy41NC01LjQxLTMuNTQtOS4xNXMxLjE4LTYuNzYsMy41NC05LjA4YzIuMzYtMi4zMSw1LjM2LTMuNDcsOS0zLjQ3WiIvPgogIDwvZz4KPC9zdmc+";

const I = {
  leaf: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.1 17 3.1s2 6.9 2 12.8c0 1.1-.1 2.1-.3 3.1M6.7 17.3l4.3-4.3"/></svg>,
  shield: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  handshake: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3L14 8l-4-2-3 3 2 4Z"/><path d="m2 2 8 8"/><path d="m8 8 1-1a5.2 5.2 0 0 1 7.4 0"/></svg>,
  map: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  check: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>,
  arrow: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
  repeat: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="m17 1 4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="m7 23-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
  mail: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
};

const HERO_SLIDES = [
  {img:"/Happybuzz_Ad_Gameboy.png",title:"Alte Lieblingsstücke.",sub:"Neue Geschichten."},
  {img:"/Happybuzz_Ad_Camera.png",title:"Jedes Ding hat eine Geschichte.",sub:"Manche warten auf ein neues Kapitel."},
  {img:"/Happybuzz_Ad_Vinyl.png",title:"Was einmal bewegt hat,",sub:"bewegt wieder."},
];

function HeroCarousel() {
  const [active,setActive]=useState(0);
  useEffect(()=>{
    const timer=setInterval(()=>setActive(a=>(a+1)%HERO_SLIDES.length),5000);
    return()=>clearInterval(timer);
  },[]);
  const s=HERO_SLIDES[active];
  return (
    <div style={{position:"relative",borderRadius:16,overflow:"hidden",boxShadow:"0 8px 32px rgba(0,0,0,.1)"}}>
      <div style={{position:"relative",width:"100%",aspectRatio:"4/3",overflow:"hidden"}}>
        {HERO_SLIDES.map((slide,i)=>(
          <img key={i} src={slide.img} alt={slide.title}
            style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",
              opacity:i===active?1:0,transition:"opacity .8s ease"}} />
        ))}
        <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"48px 24px 20px",
          background:"linear-gradient(transparent,rgba(0,0,0,.55))"}}>
          <p style={{fontSize:16,fontWeight:800,color:"#fff",margin:"0 0 2px"}}>{s.title}</p>
          <p style={{fontSize:13,color:"rgba(255,255,255,.85)",margin:0}}>{s.sub}</p>
        </div>
      </div>
      {/* Dots */}
      <div style={{position:"absolute",bottom:8,left:"50%",transform:"translateX(-50%)",display:"flex",gap:6}}>
        {HERO_SLIDES.map((_,i)=>(
          <button key={i} onClick={()=>setActive(i)}
            style={{width:i===active?24:8,height:8,borderRadius:4,border:"none",
              background:i===active?"#fff":"rgba(255,255,255,.5)",cursor:"pointer",transition:"all .3s",padding:0}} />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [email,setEmail]=useState("");
  const [submitted,setSubmitted]=useState(false);
  const [error,setError]=useState("");
  

  const handleSubmit=()=>{
    if(!email.includes("@")||!email.includes(".")){setError("Bitte gib eine gültige E-Mail-Adresse ein.");return;}
    setError("");
    try{
      const iframe=document.createElement("iframe");
      iframe.name="mc_iframe";iframe.style.display="none";
      document.body.appendChild(iframe);
      const form=document.createElement("form");
      form.action="https://happybuzz.us3.list-manage.com/subscribe/post?u=40d19fb37a502ba7b4f823e46&id=3f6104fa23";
      form.method="POST";form.target="mc_iframe";
      const inp=document.createElement("input");inp.name="EMAIL";inp.value=email;form.appendChild(inp);
      const bot=document.createElement("input");bot.name="b_40d19fb37a502ba7b4f823e46_3f6104fa23";bot.value="";form.appendChild(bot);
      document.body.appendChild(form);form.submit();
      setTimeout(()=>{document.body.removeChild(form);document.body.removeChild(iframe);},3000);
      setSubmitted(true);setEmail("");
    }catch(e){setError("Etwas ist schiefgelaufen. Versuch es nochmal.");}
  };

  return (
    <div style={{fontFamily:T.font,background:T.bg,minHeight:"100vh",color:T.text}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}@keyframes up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}::selection{background:#F4C03F33}
        @media(max-width:768px){
          .hero-split{grid-template-columns:1fr!important}
          .hero-right{display:none!important}
          .usp-grid{grid-template-columns:1fr!important}
          .fee-grid{grid-template-columns:repeat(3,1fr)!important}
          .footer-grid{grid-template-columns:1fr!important;text-align:center}
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{padding:"28px 32px",display:"flex",justifyContent:"center"}}>
        <img src={LOGO_URI} alt="HappyBuzz" style={{height:80,width:"auto"}} />
      </nav>

      <main style={{maxWidth:1060,margin:"0 auto",padding:"0 24px"}}>

        {/* ── HERO ── */}
        <section className="hero-split" style={{padding:"40px 0 48px",display:"grid",gridTemplateColumns:"1fr 400px",gap:48,alignItems:"center"}}>
          <div style={{animation:"up .6s ease"}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,background:T.greenSoft,borderRadius:20,padding:"6px 16px",fontSize:11.5,fontWeight:700,color:T.green,marginBottom:20}}>
              {I.leaf} Jeder Verkauf unterstützt Bienenschutz
            </div>
            <h1 style={{fontSize:"clamp(32px,5.5vw,48px)",fontWeight:900,color:T.text,lineHeight:1.08,margin:"0 0 16px",letterSpacing:"-0.03em"}}>
              Kaufen. Verkaufen.<br/>Mieten. Vermieten.<br/><span style={{color:T.honey}}>Gutes tun.</span>
            </h1>
            <p style={{fontSize:16.5,color:T.textMd,maxWidth:480,lineHeight:1.6,margin:"0 0 28px"}}>
              Der faire Schweizer Marktplatz, bei dem du deinen Beitrag selbst wählst — und mit jedem Deal Bienen unterstützt.
            </p>

            {/* Email signup */}
            {submitted ? (
              <div style={{background:T.greenSoft,borderRadius:T.radius,padding:"18px 22px",maxWidth:440,animation:"up .4s ease",border:`1px solid #BBF7D0`}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <span style={{color:T.green}}>{I.check}</span>
                  <p style={{fontSize:15,fontWeight:800,color:T.text,margin:0}}>Du bist dabei!</p>
                </div>
                <p style={{fontSize:13,color:T.textMd,margin:0}}>Wir melden uns, sobald HappyBuzz startet.</p>
              </div>
            ) : (
              <div style={{maxWidth:440}}>
                <div style={{display:"flex",gap:8,marginBottom:8}}>
                  <div style={{flex:1,display:"flex",alignItems:"center",background:T.surface,borderRadius:T.rSm,padding:"0 14px",border:`1.5px solid ${error?T.red||"#D94444":T.border}`}}>
                    <span style={{color:T.textLt,marginRight:8,display:"flex"}}>{I.mail}</span>
                    <input value={email} onChange={e=>{setEmail(e.target.value);setError("");}} placeholder="deine@email.ch"
                      onKeyDown={e=>{if(e.key==="Enter")handleSubmit();}}
                      style={{border:"none",outline:"none",padding:"13px 0",fontSize:14,width:"100%",background:"transparent",fontFamily:T.font}} />
                  </div>
                  <button onClick={handleSubmit} style={{
                    padding:"13px 24px",borderRadius:T.rSm,border:"none",background:T.honey,color:"#fff",
                    fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:T.font,transition:"background .15s",whiteSpace:"nowrap",
                    display:"flex",alignItems:"center",gap:6,opacity:1
                  }}
                    onMouseEnter={e=>e.target.style.background=T.honeyHover}
                    onMouseLeave={e=>e.target.style.background=T.honey}
                  >{"Dabei sein"} {I.arrow}</button>
                </div>
                {error&&<p style={{fontSize:12,color:"#D94444",margin:"0 0 4px"}}>{error}</p>}
                <p style={{fontSize:11.5,color:T.textLt,margin:0}}>Kein Spam. Nur eine Nachricht, wenn wir starten.</p>
              </div>
            )}

            {/* Stats */}
            <div style={{display:"flex",gap:28,marginTop:28}}>
              <div><p style={{fontSize:17,fontWeight:900,color:T.honey,margin:"0 0 1px"}}>Ab 3%</p><p style={{fontSize:11,color:T.textLt,margin:0}}>Faire Gebühren</p></div>
              <div><p style={{fontSize:17,fontWeight:900,color:T.text,margin:"0 0 1px"}}>2026/2027</p><p style={{fontSize:11,color:T.textLt,margin:0}}>Geplanter Launch</p></div>
              <div><p style={{fontSize:17,fontWeight:900,color:T.green,margin:"0 0 1px"}}>100%</p><p style={{fontSize:11,color:T.textLt,margin:0}}>Fair & transparent</p></div>
            </div>
          </div>

          {/* Right side - Image carousel */}
          <div className="hero-right" style={{animation:"up .8s ease"}}>
            <HeroCarousel />
          </div>
        </section>

        {/* ── USPs ── */}
        <section className="usp-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:48,animation:"up 1s ease"}}>
          {[
            {icon:I.handshake,t:"Faire Beiträge",d:"Du wählst beim Verkauf selbst: 3%, 5%, 7% oder mehr. Keine versteckten Gebühren."},
            {icon:I.leaf,t:"Transparenter Impact",d:"Ein Teil deines Beitrags fliesst direkt in Schweizer Bienenschutzprojekte."},
            {icon:I.map,t:"Für die Schweiz gemacht",d:"Kaufen, verkaufen, mieten, vermieten — modern, fair und lokal."},
          ].map(f=>(
            <div key={f.t} style={{background:T.surface,borderRadius:T.radius,padding:"24px 20px",border:`1px solid ${T.border}`}}>
              <div style={{width:36,height:36,borderRadius:10,background:T.honeySoft,display:"flex",alignItems:"center",justifyContent:"center",color:T.honey,marginBottom:12}}>{f.icon}</div>
              <p style={{fontSize:14,fontWeight:800,color:T.text,margin:"0 0 6px"}}>{f.t}</p>
              <p style={{fontSize:12.5,color:T.textMd,margin:0,lineHeight:1.55}}>{f.d}</p>
            </div>
          ))}
        </section>

        {/* ── How it differs ── */}
        <section style={{marginBottom:48,textAlign:"center"}}>
          <h2 style={{fontSize:22,fontWeight:900,color:T.text,margin:"0 0 6px"}}>Warum HappyBuzz?</h2>
          <p style={{fontSize:14,color:T.textMd,maxWidth:440,margin:"0 auto 28px",lineHeight:1.55}}>Andere Marktplätze bestimmen deine Gebühren. Bei uns entscheidest du.</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,maxWidth:600,margin:"0 auto"}}>
            <div style={{background:T.warm,borderRadius:T.radius,padding:"22px 20px",textAlign:"left"}}>
              <p style={{fontSize:13,fontWeight:800,color:T.textLt,margin:"0 0 12px"}}>Andere Plattformen</p>
              {["Fixe Gebühren ~10%","Kein Impact","Du zahlst, was sie wollen","Keine Transparenz"].map(t=>(
                <p key={t} style={{fontSize:12.5,color:T.textLt,margin:"0 0 6px",display:"flex",alignItems:"center",gap:6}}>
                  <span style={{color:T.textLt}}>✕</span> {t}
                </p>
              ))}
            </div>
            <div style={{background:T.honeySoft,borderRadius:T.radius,padding:"22px 20px",textAlign:"left",border:`1.5px solid ${T.honey}`}}>
              <p style={{fontSize:13,fontWeight:800,color:T.honey,margin:"0 0 12px"}}>HappyBuzz</p>
              {["Du wählst ab 3%","Bienenschutz inklusive","Fair & transparent","Mieten & Vermieten"].map(t=>(
                <p key={t} style={{fontSize:12.5,color:T.text,margin:"0 0 6px",display:"flex",alignItems:"center",gap:6}}>
                  <span style={{color:T.green}}>{I.check}</span> {t}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA repeat ── */}
        <section style={{marginBottom:48,background:T.surface,borderRadius:16,padding:"40px 32px",border:`1px solid ${T.border}`,textAlign:"center"}}>
          <h2 style={{fontSize:22,fontWeight:900,color:T.text,margin:"0 0 8px"}}>Sei von Anfang an dabei.</h2>
          <p style={{fontSize:14,color:T.textMd,maxWidth:400,margin:"0 auto 20px",lineHeight:1.55}}>Trag dich ein und erfahre als Erstes, wenn HappyBuzz startet. Kein Spam, versprochen.</p>
          {submitted ? (
            <div style={{display:"inline-flex",alignItems:"center",gap:8,background:T.greenSoft,borderRadius:T.rSm,padding:"12px 20px",color:T.green,fontWeight:700,fontSize:14}}>
              {I.check} Du bist auf der Warteliste!
            </div>
          ) : (
            <div style={{display:"flex",gap:8,maxWidth:400,margin:"0 auto",flexDirection:"column",alignItems:"center"}}>
              <div style={{display:"flex",gap:8,width:"100%"}}>
                <input value={email} onChange={e=>{setEmail(e.target.value);setError("");}} placeholder="deine@email.ch"
                  onKeyDown={e=>{if(e.key==="Enter")handleSubmit();}}
                  style={{flex:1,padding:"12px 16px",borderRadius:T.rSm,border:`1.5px solid ${error?"#D94444":T.border}`,fontSize:14,outline:"none",fontFamily:T.font,boxSizing:"border-box"}} />
                <button onClick={handleSubmit} style={{
                  padding:"12px 24px",borderRadius:T.rSm,border:"none",background:T.honey,color:"#fff",
                  fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:T.font,whiteSpace:"nowrap",opacity:1
                }}>{"Dabei sein"}</button>
              </div>
              {error&&<p style={{fontSize:12,color:"#D94444",margin:0}}>{error}</p>}
            </div>
          )}
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer style={{borderTop:`1px solid ${T.border}`,padding:"24px 32px",maxWidth:1060,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
          <img src={LOGO_URI} alt="HappyBuzz" style={{height:36,width:"auto"}} />
          <p style={{fontSize:11,color:T.textLt,margin:0}}>© 2026 HappyBuzz — Made with care in Switzerland</p>
        </div>
      </footer>
    </div>
  );
}
