"use client";
import { supabase } from "@/lib/supabase/supabase";
import { colors, fonts, radius } from "@/lib/theme";
import { Check, Circle } from "lucide-react";

import { useState, useEffect } from "react";

const C = colors; // Alias for brevity in this file

// Katalog-Tokens (wie öffentliche Seiten)
const K = { ink: "#14110D", sand: "#ECE3D2", paper: "#FBF8F2", honey: "#F4C03F", petrol: "#0B5E5C" };
const MONO = "'Space Mono', monospace";
const BODY = "Manrope, sans-serif";

// ─── Logo SVG ───────────────────────────────────────────────────────────
function Logo({ width = 220 }) {
  return (
    <svg width={width} viewBox="0 0 1076.41 169.1" fill="none">
      <circle cx="84.54" cy="84.54" r="84.54" fill="#f4c03e"/>
      <g fill="#1a1716">
        <path d="M145.76,80.77c-3.52-4.15-8.56-6.7-13.83-7-.06,0-.12,0-.19,0v-.06h-1.86c-.39,0-.79,0-1.22,0-.48,0-.96,0-1.42,0h-3.35c-.75,0-1.5,0-2.25,0-.76,0-1.51,0-2.27,0-1.33,0-2.42,0-3.44.01-.02,0-.04,0-.05,0-.2-.01-.5-.03-.85-.03-3.91,0-6.23,2.08-7.27,3.32l-1.83,2.19v1.61c-.41,1.82-.49,4.13-.28,7.23.08,1.13.23,2.81.52,4.41.38,2.08,1.05,4.46,3.06,6.32,2.93,2.72,5.59,4.72,8.36,6.3,3.55,2.02,7.28,3.29,11.11,3.78.92.12,1.86.18,2.77.18,4.46,0,8.75-1.42,12.06-3.99,3.65-2.84,5.94-6.89,6.43-11.39h0c.49-4.51-1.01-9.07-4.21-12.84ZM142.16,92.76c-.59,5.46-6.07,9.08-12.46,8.27-6.06-.77-10.81-4.04-15.13-8.05-1.04-.95-1.59-10.01-.79-10.95.68-.82,2.26-.48,3.21-.5,1.71-.02,3.42.02,5.14.03,4.76.02,10.3-.86,14.57,1.69,3.27,1.95,5.83,5.58,5.46,9.51Z"/>
        <path d="M63.15,80.79v-1.61l-1.83-2.19c-1.04-1.24-3.36-3.32-7.27-3.32-.35,0-.65.02-.85.03-.02,0-.04,0-.05,0-1.01,0-2.1-.01-3.44-.01-.76,0-1.51,0-2.27,0-.75,0-1.5,0-2.25,0h-3.35c-.47,0-.94,0-1.42,0-.43,0-.83,0-1.22,0h-1.86v.06c-.06,0-.12,0-.19,0-5.27.3-10.32,2.85-13.83,7-3.2,3.77-4.7,8.33-4.21,12.83h0c.49,4.52,2.78,8.56,6.43,11.4,3.31,2.57,7.59,3.99,12.06,3.99.92,0,1.85-.06,2.77-.18,3.82-.49,7.56-1.76,11.11-3.78,2.77-1.58,5.43-3.58,8.36-6.3,2.01-1.86,2.68-4.24,3.06-6.32.3-1.6.45-3.28.52-4.41.21-3.11.13-5.41-.28-7.23ZM54.51,92.98c-4.32,4.01-9.07,7.28-15.13,8.05-6.39.81-11.87-2.81-12.46-8.27-.37-3.94,2.2-7.56,5.46-9.51,4.27-2.55,9.8-1.66,14.57-1.69,1.71,0,3.42-.05,5.14-.03.95.01,2.52-.32,3.21.5.8.95.25,10-.79,10.95Z"/>
        <path d="M74.72,46.94c-4.18-7.44-9.38-15.59-17.75-18.49-1.43-2.83-4.36-4.78-7.75-4.78-4.8,0-8.69,3.89-8.69,8.69s3.89,8.69,8.69,8.69c2.79,0,5.27-1.32,6.86-3.37.16.09.32.17.47.26.41.25.8.51,1.19.79.02.01.03.02.05.03-.04-.04-.09-.08-.13-.12.06.06.13.12.21.17.15.11.19.14.15.12.07.05.14.11.2.16.77.64,1.5,1.34,2.18,2.07.35.37.69.76,1.02,1.15.17.2.33.42.51.62,0,0,0,0,.01.01.63.86,1.24,1.72,1.81,2.61,1.22,1.89,2.32,3.85,3.42,5.81,1.12,2,4.03,2.84,6,1.57,2.02-1.3,2.78-3.86,1.57-6h0Z"/>
        <path d="M114.43,72.62c-.2-3.89-.86-7.73-2.46-11.48-1.94-4.56-5.08-8.45-9.05-11.41h0c-.54-.4-1.1-.79-1.68-1.15-.84-.53-1.71-1.01-2.61-1.46-1.13-.56-2.29-1.04-3.48-1.45h0c-3.4-1.18-6.99-1.78-10.57-1.79h-.01c-1.79,0-3.59.16-5.36.46-1.77.3-3.52.74-5.22,1.33h0c-1.19.42-2.35.9-3.48,1.46-.9.44-1.77.93-2.61,1.46-.58.37-1.14.75-1.68,1.15h0c-3.97,2.96-7.11,6.85-9.05,11.41-1.6,3.76-2.25,7.59-2.46,11.48-.19,3.62.02,7.28.23,10.96h0c.05.79.09,1.58.13,2.37.13,2.52.21,5.04.24,7.57h0c.04,2.77.03,5.55.02,8.32,0,1.76-.02,3.52-.03,5.28-.01,3.12.02,6.3.81,9.33.78,2.98,2.49,5.94,4.33,8.39,3.15,4.18,7.61,7.11,12.61,8.61,3.57,1.06,5.51,3,7.02,6.14.57,1.19.85,2.48,1.39,3.69.63,1.39,1.44,2.13,3.03,2.14h.12c1.59,0,2.39-.75,3.03-2.14.54-1.2.82-2.5,1.39-3.69,1.51-3.14,3.45-5.08,7.02-6.14,5-1.5,9.46-4.42,12.61-8.61,1.84-2.44,3.55-5.41,4.33-8.39.8-3.03.83-6.21.81-9.33,0-1.76-.02-3.52-.03-5.28-.01-2.78-.02-5.55.02-8.32h0c.04-2.52.11-5.05.24-7.57.04-.79.09-1.58.13-2.37h0c.21-3.68.42-7.34.23-10.96ZM63.62,86.82c.15-4.82,0-9.64.05-14.46h0c.08-8.86,6.19-17.36,14.85-19.72,2.01-.55,4.05-.81,6.06-.79,2.01-.01,4.05.24,6.06.79,8.66,2.36,14.76,10.86,14.85,19.72h0c.05,4.82-.1,9.64.05,14.46.07,2.07-.62,2.53-2.57,2.49-6.11-.13-12.25-.19-18.38-.19h-.01c-6.13,0-12.27.06-18.38.19-1.94.04-2.64-.42-2.57-2.49h0ZM87.42,126.53c-.93.03-1.88.06-2.84.06-.96,0-1.91-.03-2.84-.06-7.34-.23-14.01-5.11-16.39-12.26,6.42.43,12.81.49,19.23.47,6.42.02,12.82-.04,19.23-.47-2.38,7.15-9.05,12.03-16.39,12.26ZM105.55,104.68c0,1.02-.84,1.86-1.86,1.86h-38.22c-1.02,0-1.86-.84-1.86-1.86v-4.58c0-1.02.84-1.86,1.86-1.86h38.22c1.02,0,1.86.84,1.86,1.86v4.58Z"/>
        <path d="M94.43,46.94h0c-1.2,2.14-.45,4.69,1.57,6,1.97,1.27,4.87.43,6-1.57,1.1-1.96,2.2-3.92,3.42-5.81.57-.89,1.18-1.76,1.81-2.61,0,0,0,0,.01-.01.17-.2.34-.41.51-.62.33-.39.67-.77,1.02-1.15.69-.73,1.41-1.42,2.18-2.07.06-.05.13-.11.2-.16-.04.02,0-.01.15-.12.07-.06.14-.11.21-.17-.05.04-.09.08-.13.12.02-.01.03-.02.05-.03.39-.28.78-.54,1.19-.79.15-.09.31-.17.47-.26,1.59,2.05,4.07,3.37,6.86,3.37,4.8,0,8.69-3.89,8.69-8.69s-3.89-8.69-8.69-8.69c-3.39,0-6.32,1.95-7.75,4.78-8.37,2.9-13.57,11.05-17.75,18.49h0Z"/>
        <path d="M93.5,84.41c-3.21,3.48-14.46,3.38-17.72-.11-1.09-1.17-1.92-2.46-1.17-4.09.67-1.43,1.97-1.77,3.5-1.71,2.28.08,4.56.02,6.84.02v.05h6.09c1.44,0,2.83.15,3.5,1.71.71,1.64.02,2.99-1.04,4.15Z"/>
        <path d="M89.22,73.85c-2.96-2.96-2.96-7.75,0-10.7,2.96-2.96,7.75-2.96,10.7,0s2.96,7.75,0,10.7-7.75,2.96-10.7,0Z"/>
        <path d="M69.24,73.85c-2.96-2.96-2.96-7.75,0-10.7,2.96-2.96,7.75-2.96,10.7,0,2.96,2.96,2.96,7.75,0,10.7s-7.75,2.96-10.7,0Z"/>
      </g>
      <g fill="#010101">
        <path d="M218.47,29.8h26.27v109.49h-26.27V29.8ZM273.96,96.35c0-4.52-1.23-8.12-3.69-10.77-2.46-2.66-5.76-3.98-9.89-3.98-4.82.1-8.63,1.84-11.44,5.24-2.8,3.39-4.21,7.75-4.21,13.06h-6.35c0-9.05,1.33-16.65,3.98-22.8,2.66-6.15,6.44-10.79,11.36-13.94,4.92-3.15,10.72-4.72,17.41-4.72,5.9,0,11.02,1.25,15.35,3.76,4.33,2.51,7.7,6.05,10.11,10.62,2.41,4.58,3.62,9.96,3.62,16.16v50.32h-26.27v-42.94Z"/>
        <path d="M347.44,105.35c-3.74,0-6.52.66-8.34,1.99-1.82,1.33-2.73,3.42-2.73,6.27s.93,5.09,2.8,6.71c1.87,1.62,4.52,2.43,7.97,2.43,2.66,0,5.09-.44,7.3-1.33,2.21-.89,4.08-2.14,5.61-3.76,1.52-1.62,2.53-3.47,3.03-5.53l3.69,11.66c-2.17,5.41-5.61,9.54-10.33,12.4-4.72,2.85-10.53,4.28-17.41,4.28-5.71,0-10.6-1.08-14.68-3.25-4.08-2.16-7.21-5.11-9.37-8.85-2.17-3.74-3.25-8.02-3.25-12.84,0-7.57,2.63-13.48,7.89-17.71,5.26-4.23,12.81-6.39,22.65-6.49h23.32v14.02h-18.15ZM363.08,90.45c0-3.84-1.28-6.84-3.84-9-2.56-2.16-6.35-3.25-11.36-3.25-3.35,0-7.08.54-11.21,1.62-4.13,1.08-8.36,2.71-12.69,4.87l-7.23-17.41c4.23-1.87,8.34-3.47,12.32-4.8,3.98-1.33,8.04-2.34,12.17-3.03,4.13-.69,8.36-1.03,12.69-1.03,11.12,0,19.7,2.53,25.75,7.6,6.05,5.07,9.12,12.17,9.22,21.32v51.94h-25.82v-48.84Z"/>
        <path d="M407.35,59.61h26.27v108.31h-26.27V59.61ZM457.08,58.72c7.47,0,13.99,1.7,19.55,5.09,5.56,3.39,9.89,8.17,12.99,14.31,3.1,6.15,4.65,13.41,4.65,21.77s-1.5,15-4.5,21.1c-3,6.1-7.23,10.82-12.69,14.17-5.46,3.35-11.93,5.02-19.41,5.02-6.69,0-12.47-1.65-17.34-4.94-4.87-3.29-8.61-7.97-11.21-14.02-2.61-6.05-3.91-13.21-3.91-21.47s1.28-15.76,3.84-21.91c2.56-6.15,6.22-10.87,10.99-14.17,4.77-3.29,10.45-4.94,17.04-4.94ZM450.59,78.94c-3.25,0-6.17.86-8.78,2.58-2.61,1.72-4.62,4.08-6.05,7.08-1.43,3-2.14,6.52-2.14,10.55s.71,7.45,2.14,10.55c1.42,3.1,3.44,5.49,6.05,7.16,2.61,1.67,5.53,2.51,8.78,2.51,3.44,0,6.47-.86,9.08-2.58,2.61-1.72,4.62-4.11,6.05-7.16,1.42-3.05,2.14-6.54,2.14-10.48s-.71-7.43-2.14-10.48c-1.43-3.05-3.45-5.43-6.05-7.16-2.61-1.72-5.63-2.58-9.08-2.58Z"/>
        <path d="M508.58,59.61h26.27v108.31h-26.27V59.61ZM558.31,58.72c7.47,0,13.99,1.7,19.55,5.09,5.56,3.39,9.89,8.17,12.99,14.31,3.1,6.15,4.65,13.41,4.65,21.77s-1.5,15-4.5,21.1c-3,6.1-7.23,10.82-12.69,14.17-5.46,3.35-11.93,5.02-19.41,5.02-6.69,0-12.47-1.65-17.34-4.94-4.87-3.29-8.61-7.97-11.21-14.02-2.61-6.05-3.91-13.21-3.91-21.47s1.28-15.76,3.84-21.91c2.56-6.15,6.22-10.87,10.99-14.17,4.77-3.29,10.45-4.94,17.04-4.94ZM551.82,78.94c-3.25,0-6.17.86-8.78,2.58-2.61,1.72-4.62,4.08-6.05,7.08-1.43,3-2.14,6.52-2.14,10.55s.71,7.45,2.14,10.55c1.42,3.1,3.44,5.49,6.05,7.16,2.61,1.67,5.53,2.51,8.78,2.51,3.44,0,6.47-.86,9.08-2.58,2.61-1.72,4.62-4.11,6.05-7.16,1.42-3.05,2.14-6.54,2.14-10.48s-.71-7.43-2.14-10.48c-1.43-3.05-3.45-5.43-6.05-7.16-2.61-1.72-5.63-2.58-9.08-2.58Z"/>
        <path d="M649.65,147.26c-2.95,7.38-7.03,12.86-12.25,16.45-5.22,3.59-11.56,5.39-19.04,5.39-4.53,0-8.68-.66-12.47-1.99-3.79-1.33-7.5-3.42-11.14-6.27l10.92-17.86c3.54,2.95,7.08,4.43,10.62,4.43,2.16,0,4.06-.52,5.68-1.55,1.62-1.03,2.93-2.58,3.91-4.65l1.92-3.84-33.05-77.77h27l19.04,52.24,16.97-52.24h26.12l-34.24,87.65Z"/>
        <path d="M693.48,29.8h26.27v109.49h-26.27V29.8ZM743.21,58.72c7.47,0,13.99,1.7,19.55,5.09,5.56,3.39,9.89,8.17,12.99,14.31,3.1,6.15,4.65,13.41,4.65,21.77s-1.5,15-4.5,21.1c-3,6.1-7.23,10.82-12.69,14.17-5.46,3.35-11.93,5.02-19.41,5.02-6.69,0-12.47-1.65-17.34-4.94-4.87-3.29-8.61-7.97-11.21-14.02-2.61-6.05-3.91-13.21-3.91-21.47s1.28-15.76,3.84-21.91c2.56-6.15,6.22-10.87,10.99-14.17,4.77-3.29,10.45-4.94,17.04-4.94ZM736.72,78.94c-3.25,0-6.17.86-8.78,2.58-2.61,1.72-4.62,4.08-6.05,7.08-1.43,3-2.14,6.52-2.14,10.55s.71,7.45,2.14,10.55c1.42,3.1,3.44,5.49,6.05,7.16,2.61,1.67,5.53,2.51,8.78,2.51,3.44,0,6.47-.86,9.08-2.58,2.61-1.72,4.62-4.11,6.05-7.16,1.42-3.05,2.14-6.54,2.14-10.48s-.71-7.43-2.14-10.48c-1.43-3.05-3.45-5.43-6.05-7.16-2.61-1.72-5.63-2.58-9.08-2.58Z"/>
        <path d="M817.88,102.55c0,4.53,1.15,8.12,3.47,10.77,2.31,2.66,5.43,3.98,9.37,3.98,4.72-.1,8.39-1.87,10.99-5.31,2.61-3.44,3.91-7.77,3.91-12.99h6.2c0,8.95-1.28,16.5-3.84,22.65-2.56,6.15-6.2,10.8-10.92,13.94-4.72,3.15-10.38,4.72-16.97,4.72-5.71,0-10.7-1.25-14.98-3.76-4.28-2.51-7.6-6.03-9.96-10.55-2.36-4.52-3.54-9.89-3.54-16.08v-50.32h26.27v42.94ZM845.62,59.61h26.27v79.69h-26.27V59.61Z"/>
        <path d="M888.26,59.61h69.95v15.79l-38.37,44.12h39.84v19.77h-72.75v-15.79l38.37-44.12h-37.04v-19.77Z"/>
        <path d="M970.16,59.61h69.95v15.79l-38.37,44.12h39.84v19.77h-72.75v-15.79l38.37-44.12h-37.04v-19.77Z"/>
      </g>
      <circle cx="1063.71" cy="127.74" r="12.69" fill="#f4c03e"/>
    </svg>
  );
}

// ─── UI-Komponenten ─────────────────────────────────────────────────────
const MailIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 4L12 13 2 4"/></svg>;
const LockIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const UserIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>;
const MailOpen = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.yellow} strokeWidth="1.5"><path d="M22 10v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8"/><path d="M22 10l-10 5L2 10"/><path d="M2 10l4-5h12l4 5"/></svg>;
const EyeIcon = ({open}) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{open ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></> : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>}</svg>;
const ArrowLeft = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>;
const GoogleIcon = () => <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>;
const AppleIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill={C.dark}><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>;

function Input({ label, type="text", value, onChange, placeholder, error, icon }) {
  const [f, setF] = useState(false);
  const [show, setShow] = useState(false);
  const isPw = type === "password";
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display:"block", fontSize:10, fontWeight:700, fontFamily:MONO, letterSpacing:".12em", textTransform:"uppercase", color:K.ink, marginBottom:6 }}>{label}</label>
      <div style={{ position:"relative" }}>
        {icon && <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:f?K.petrol:C.muted, transition:"color .2s", display:"flex" }}>{icon}</span>}
        <input type={isPw && show ? "text" : type} value={value} onChange={onChange} placeholder={placeholder} onFocus={()=>setF(true)} onBlur={()=>setF(false)}
          style={{ width:"100%", padding:icon?"12px 46px 12px 40px":"12px 16px", borderRadius: 0, border:`1.5px solid ${error?C.red:f?K.petrol:K.ink}`, background:"#fff", fontSize:15, fontFamily:BODY, color:K.ink, outline:"none", transition:"border-color .2s, box-shadow .2s", boxShadow:f?`3px 3px 0 ${K.honey}`:"none", boxSizing:"border-box" }}/>
        {isPw && <button type="button" onClick={()=>setShow(!show)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:C.muted, display:"flex", padding:4 }}><EyeIcon open={show}/></button>}
      </div>
      {error && <p style={{ color:C.red, fontSize:12, marginTop:3, fontWeight:500 }}>{error}</p>}
    </div>
  );
}

function PasswordStrength({ password }) {
  const checks = [{ l:"8+ Zeichen", ok:password.length>=8 }, { l:"Grossbuchstabe", ok:/[A-Z]/.test(password) }, { l:"Zahl", ok:/\d/.test(password) }];
  const score = checks.filter(c=>c.ok).length;
  const barColors = ["#ccc",C.red,C.yellow,C.green];
  if (!password) return null;
  return (
    <div style={{ marginTop:-10, marginBottom:16 }}>
      <div style={{ display:"flex", gap:4, marginBottom:5 }}>{[0,1,2].map(i=><div key={i} style={{ flex:1, height:3, borderRadius: 0, background:i<score?barColors[score]:C.border, transition:"background .3s" }}/>)}</div>
      <div style={{ display:"flex", gap:10 }}>{checks.map((c,i)=><span key={i} style={{ display:"inline-flex", alignItems:"center", gap:3, fontSize:11, color:c.ok?C.green:C.muted, fontWeight:500 }}>{c.ok?<Check size={12}/>:<Circle size={12}/>} {c.l}</span>)}</div>
    </div>
  );
}

function SocialBtn({ icon, label, onClick, disabled }) {
  const [h, setH] = useState(false);
  // disabled: OAuth-Anbieter sind noch nicht konfiguriert — Buttons bleiben
  // sichtbar (Nutzer sehen, was kommt), aber ausgegraut und ohne Aktion.
  return (
    <button type="button" onClick={disabled ? undefined : onClick} disabled={disabled}
      title={disabled ? `Anmeldung mit ${label} folgt in Kürze` : undefined}
      onMouseEnter={()=>!disabled&&setH(true)} onMouseLeave={()=>setH(false)}
      style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, width:"100%", padding:"11px 16px", borderRadius: 0, border:`1px solid ${disabled?"rgba(20,17,13,0.25)":K.ink}`, background:h?K.sand:"#fff", cursor:disabled?"not-allowed":"pointer", fontSize:14, fontWeight:700, color:K.ink, fontFamily:BODY, transition:"background .2s", opacity:disabled?0.45:1, filter:disabled?"grayscale(1)":"none" }}>
      {icon}{label}
    </button>
  );
}

function Btn({ children, onClick, loading, secondary, type="button" }) {
  return (
    <button type={type} onClick={onClick} disabled={loading} style={{
      width:"100%", padding:"13px", border:`1px solid ${K.ink}`, borderRadius: 0,
      background:secondary?"transparent":K.honey, color:K.ink, fontSize:14, fontWeight:800,
      fontFamily:BODY, letterSpacing:".02em", cursor:loading?"default":"pointer",
      boxShadow:loading?"none":`3px 3px 0 ${K.ink}`,
      transition:"all .15s", opacity:loading?.7:1,
    }}>
      {loading ? <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" style={{ animation:"spin .8s linear infinite" }}><circle cx="12" cy="12" r="10" stroke={C.dark} strokeWidth="2.5" fill="none" strokeDasharray="50" strokeLinecap="round" opacity=".4"/></svg>
        Einen Moment…
      </span> : children}
    </button>
  );
}

function KatalogBg() {
  // Dezente Katalog-Passmarken in den Ecken
  const mark = (pos) => <div style={{ position:"absolute", width:18, height:18, ...pos }}>
    <div style={{ position:"absolute", left:8, top:0, width:2, height:18, background:K.ink, opacity:.14 }}/>
    <div style={{ position:"absolute", left:0, top:8, width:18, height:2, background:K.ink, opacity:.14 }}/>
  </div>;
  return <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0 }}>
    {mark({ left:22, top:22 })}{mark({ right:22, top:22 })}{mark({ left:22, bottom:22 })}{mark({ right:22, bottom:22 })}
  </div>;
}

// ─── Auth Page ──────────────────────────────────────────────────────────
export default function AuthPage() {
  const [view, setView] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Check URL für Password-Reset-Token
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      setView("reset");
    }
  }, []);

  const clearForm = () => { setEmail(""); setPassword(""); setConfirmPw(""); setFirstName(""); setLastName(""); setAgree(false); setError(""); setFieldErrors({}); };
  const switchView = (v) => { clearForm(); setView(v); };

  // ─── Validation ─────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = "E-Mail ist erforderlich";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Ungültige E-Mail";
    if (view === "register" || view === "login" || view === "reset") {
      if (!password) e.password = "Passwort ist erforderlich";
      else if (view !== "login" && password.length < 8) e.password = "Mind. 8 Zeichen";
    }
    if (view === "register") {
      if (!firstName.trim()) e.firstName = "Vorname ist erforderlich";
      if (!lastName.trim()) e.lastName = "Nachname ist erforderlich";
      if (password && confirmPw && password !== confirmPw) e.confirmPw = "Passwörter stimmen nicht überein";
      if (!confirmPw) e.confirmPw = "Bitte bestätigen";
      if (!agree) e.agree = "Bitte akzeptiere die AGB";
    }
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── Auth Handlers ──────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true); setError("");
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
      // Redirect nach Login
      const params = new URLSearchParams(window.location.search);
      window.location.href = params.get("redirect") || "/";
    } catch (err) {
      setError(err.message === "Invalid login credentials" ? "E-Mail oder Passwort ist falsch." : err.message);
    } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true); setError("");
    try {
      const { data, error: err } = await supabase.auth.signUp({
        email, password,
        options: {
          data: {
            full_name: `${firstName.trim()} ${lastName.trim()}`,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
          },
          emailRedirectTo: `${window.location.origin}/login/callback`,
        },
      });
      if (err) throw err;
      if (data.user && !data.user.identities?.length) throw { message: "Diese E-Mail ist bereits registriert." };
      setView("verify");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleForgot = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { setFieldErrors({ email: "Bitte gib deine E-Mail ein" }); return; }
    setLoading(true); setError("");
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login?type=recovery`,
      });
      if (err) throw err;
      setView("forgot-sent");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleResetPassword = async () => {
    if (!password || password.length < 8) { setFieldErrors({ password: "Mind. 8 Zeichen" }); return; }
    if (password !== confirmPw) { setFieldErrors({ confirmPw: "Passwörter stimmen nicht überein" }); return; }
    setLoading(true); setError("");
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      const params2 = new URLSearchParams(window.location.search); window.location.href = params2.get("redirect") || "/";
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleOAuth = async (provider) => {
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider, options: { redirectTo: `${window.location.origin}/login/callback` },
      });
      if (err) throw err;
    } catch (err) { setError(err.message); }
  };

  // ─── Render Helpers ─────────────────────────────────────────────────
  const renderDivider = () => (
    <div style={{ display:"flex", alignItems:"center", gap:12, margin:"20px 0" }}>
      <div style={{ flex:1, height:1, background:C.border }}/><span style={{ fontSize:12, color:C.muted, fontWeight:500 }}>oder</span><div style={{ flex:1, height:1, background:C.border }}/>
    </div>
  );

  const renderError = () => error && (
    <div style={{ padding:"10px 14px", borderRadius: 0, background:"#FEF2F2", border:"1px solid #FECACA", marginBottom:16, fontSize:13, color:C.red, fontWeight:500 }}>{error}</div>
  );

  const renderBack = (target, label) => (
    <button onClick={()=>switchView(target)} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", color:C.muted, fontSize:13, fontWeight:600, cursor:"pointer", padding:0, marginBottom:16, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <ArrowLeft/> {label}
    </button>
  );

  // ─── Views ──────────────────────────────────────────────────────────
  const views = {
    login: () => <>
      <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, marginBottom:22 }}>
        <button type="button" onClick={()=>switchView("login")} className="tab active">Anmelden</button>
        <button type="button" onClick={()=>switchView("register")} className="tab">Registrieren</button>
      </div>
      <div style={{ display:"flex", gap:10 }}>
        <SocialBtn icon={<GoogleIcon/>} label="Google" disabled onClick={()=>handleOAuth("google")}/>
        <SocialBtn icon={<AppleIcon/>} label="Apple" disabled onClick={()=>handleOAuth("apple")}/>
      </div>
      {renderDivider()}
      {renderError()}
      <Input label="E-Mail" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="hallo@beispiel.ch" icon={<MailIcon/>} error={fieldErrors.email}/>
      <Input label="Passwort" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Dein Passwort" icon={<LockIcon/>} error={fieldErrors.password}/>
      <div style={{ display:"flex", justifyContent:"flex-end", marginTop:-8, marginBottom:18 }}>
        <a onClick={()=>switchView("forgot")} className="link">Passwort vergessen?</a>
      </div>
      <Btn onClick={handleLogin} loading={loading} type="submit">Anmelden</Btn>
      <p style={{ textAlign:"center", fontSize:13, color:C.muted, marginTop:18, fontWeight:500 }}>Noch kein Konto? <a onClick={()=>switchView("register")} className="link">Jetzt registrieren</a></p>
    </>,

    register: () => <>
      <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, marginBottom:22 }}>
        <button onClick={()=>switchView("login")} className="tab">Anmelden</button>
        <button onClick={()=>switchView("register")} className="tab active">Registrieren</button>
      </div>
      <div style={{ display:"flex", gap:10 }}>
        <SocialBtn icon={<GoogleIcon/>} label="Google" disabled onClick={()=>handleOAuth("google")}/>
        <SocialBtn icon={<AppleIcon/>} label="Apple" disabled onClick={()=>handleOAuth("apple")}/>
      </div>
      {renderDivider()}
      {renderError()}
      <div style={{ display:"flex", gap:10 }}>
        <div style={{ flex:1 }}><Input label="Vorname" value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="Max" icon={<UserIcon/>} error={fieldErrors.firstName}/></div>
        <div style={{ flex:1 }}><Input label="Nachname" value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Muster" error={fieldErrors.lastName}/></div>
      </div>
      <Input label="E-Mail" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="hallo@beispiel.ch" icon={<MailIcon/>} error={fieldErrors.email}/>
      <Input label="Passwort" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mind. 8 Zeichen" icon={<LockIcon/>} error={fieldErrors.password}/>
      <PasswordStrength password={password}/>
      <Input label="Passwort bestätigen" type="password" value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} placeholder="Passwort wiederholen" icon={<LockIcon/>} error={fieldErrors.confirmPw}/>
      <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:20 }}>
        <div onClick={()=>setAgree(!agree)} style={{ width:18, height:18, borderRadius: 0, border:`1.5px solid ${fieldErrors.agree?C.red:agree?C.yellow:C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", background:agree?C.yellow:"transparent", flexShrink:0, marginTop:1 }}>
          {agree && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke={C.dark} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </div>
        <span style={{ fontSize:13, color:fieldErrors.agree?C.red:C.muted, lineHeight:1.45 }}>Ich akzeptiere die <a className="link">AGB</a> und <a className="link">Datenschutzerklärung</a></span>
      </div>
      <Btn onClick={handleRegister} loading={loading}>Account erstellen</Btn>
      <p style={{ textAlign:"center", fontSize:13, color:C.muted, marginTop:18, fontWeight:500 }}>Bereits registriert? <a onClick={()=>switchView("login")} className="link">Jetzt anmelden</a></p>
    </>,

    forgot: () => <>
      {renderBack("login", "Zurück zum Login")}
      <h2 style={{ fontSize:21, fontWeight:700, fontFamily:"'General Sans','Manrope',sans-serif", color:K.ink, marginBottom:6 }}>Passwort vergessen?</h2>
      <p style={{ fontSize:14, color:C.muted, marginBottom:22, lineHeight:1.5 }}>Gib deine E-Mail ein und wir senden dir einen Link zum Zurücksetzen.</p>
      {renderError()}
      <Input label="E-Mail" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="hallo@beispiel.ch" icon={<MailIcon/>} error={fieldErrors.email}/>
      <Btn onClick={handleForgot} loading={loading}>Link senden</Btn>
    </>,

    "forgot-sent": () => <div style={{ textAlign:"center", padding:"16px 0" }}>
      <MailOpen/>
      <h2 style={{ fontSize:21, fontWeight:700, fontFamily:"'General Sans','Manrope',sans-serif", color:K.ink, marginTop:12, marginBottom:8 }}>E-Mail gesendet!</h2>
      <p style={{ fontSize:14, color:C.muted, lineHeight:1.6, marginBottom:24 }}>Wir haben einen Link an <strong style={{ color:C.dark }}>{email}</strong> gesendet. Prüfe dein Postfach.</p>
      <Btn onClick={()=>switchView("login")} secondary>Zurück zum Login</Btn>
      <p style={{ fontSize:12, color:C.muted, marginTop:16 }}>Keine E-Mail? Prüfe deinen Spam-Ordner.</p>
    </div>,

    verify: () => <div style={{ textAlign:"center", padding:"16px 0" }}>
      <MailOpen/>
      <h2 style={{ fontSize:21, fontWeight:700, fontFamily:"'General Sans','Manrope',sans-serif", color:K.ink, marginTop:12, marginBottom:8 }}>Bestätige deine E-Mail</h2>
      <p style={{ fontSize:14, color:C.muted, lineHeight:1.6, marginBottom:24 }}>Wir haben eine Bestätigung an <strong style={{ color:C.dark }}>{email}</strong> gesendet. Klicke auf den Link um deinen Account zu aktivieren.</p>
      <Btn onClick={()=>switchView("login")} secondary>Zurück zum Login</Btn>
    </div>,

    reset: () => <>
      <h2 style={{ fontSize:21, fontWeight:700, fontFamily:"'General Sans','Manrope',sans-serif", color:K.ink, marginBottom:6 }}>Neues Passwort wählen</h2>
      <p style={{ fontSize:14, color:C.muted, marginBottom:22, lineHeight:1.5 }}>Wähle ein sicheres neues Passwort für deinen Account.</p>
      {renderError()}
      <Input label="Neues Passwort" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mind. 8 Zeichen" icon={<LockIcon/>} error={fieldErrors.password}/>
      <PasswordStrength password={password}/>
      <Input label="Passwort bestätigen" type="password" value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} placeholder="Passwort wiederholen" icon={<LockIcon/>} error={fieldErrors.confirmPw}/>
      <Btn onClick={handleResetPassword} loading={loading}>Passwort speichern</Btn>
    </>,
  };

  return (
    <>
      <div style={{ minHeight:"100vh", background:K.sand, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:BODY, padding:"24px 16px", position:"relative" }}>
        <KatalogBg/>
        <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:420, opacity:mounted?1:0, transition:"opacity .4s" }}>
          <div style={{ textAlign:"center", marginBottom:22 }}>
            <a href="/" style={{ display:"inline-block", marginBottom:8 }}><img src="/logo.svg" alt="BEEDARO" style={{ width: 230, height: 'auto' }} /></a>
            <p style={{ fontSize:10, color:K.ink, fontWeight:700, fontFamily:MONO, letterSpacing:".18em", textTransform:"uppercase" }}>
              {view==="login"?"Zugang · Katalog der zweiten Leben":view==="register"?"Neuer Eintrag · Konto anlegen":view==="forgot"||view==="forgot-sent"?"Passwort zurücksetzen":view==="verify"?"Fast geschafft":"Neues Passwort"}
            </p>
          </div>
          <div className="card-enter" key={view} style={{ background:K.paper, borderRadius: 0, padding:"0 28px 28px", border:`1px solid ${K.ink}`, boxShadow:`8px 8px 0 rgba(20,17,13,.12)` }}>
            <div style={{ paddingTop:(view==="login"||view==="register")?0:24 }}>{views[view]?.()}</div>
          </div>
          <p style={{ textAlign:"center", fontSize:10, color:C.muted, marginTop:18, fontWeight:700, fontFamily:MONO, letterSpacing:".1em", textTransform:"uppercase" }}>© 2026 beedaro.ch · Kaufen. Verkaufen. Gutes tun.</p>
        </div>
      </div>
    </>
  );
}
