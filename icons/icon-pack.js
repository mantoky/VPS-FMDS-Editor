/* VPS-FMDS-Editor — pack de ícones embutido na build (data URI). */
(function (global) {
  function toDataUrl(svg) {
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  const svgs = {
    target: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" stroke="#082d28" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="24" r="16"/><circle cx="24" cy="24" r="8"/><path d="M24 24 38 10"/><path d="M34 10h6v6"/></svg>',
    clipboard: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" stroke="#082d28" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 7h18l3 5v28H12V12z"/><path d="M19 7v8h10V7"/><path d="M18 22h12"/><path d="M18 29h9"/></svg>',
    alert: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" stroke="#082d28" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M24 6 44 42H4z"/><path d="M24 18v11"/><path d="M24 35h.01"/></svg>',
    calendar: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" stroke="#082d28" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="10" width="32" height="30" rx="3"/><path d="M16 6v8M32 6v8M8 18h32"/><path d="M16 25h4M23 25h4M30 25h4M16 32h4M23 32h4M30 32h4"/></svg>',
    tower: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M24 6v36M16 42l8-36 8 36"/><path d="M10 18c3-4 7-6 14-6s11 2 14 6M13 23c3-3 6-5 11-5s8 2 11 5M6 13c5-6 11-9 18-9s13 3 18 9"/></svg>',
    network: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="24" r="3"/><circle cx="10" cy="14" r="3"/><circle cx="38" cy="14" r="3"/><circle cx="10" cy="34" r="3"/><circle cx="38" cy="34" r="3"/><path d="M13 16l8 6M27 22l8-6M13 32l8-6M27 26l8 6M24 21V9M24 27v12"/></svg>',
    wrench: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" stroke="#082d28" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M31 7a10 10 0 0 0 10 10L22 36l-8-8 19-19"/><path d="M15 33 8 40M5 43l6-6"/></svg>',
    antenna: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" stroke="#082d28" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M24 18v24M16 42h16M18 18a6 6 0 1 0 12 0 6 6 0 0 0-12 0Z"/><path d="M11 12a16 16 0 0 1 26 0M6 7a24 24 0 0 1 36 0"/></svg>'
  };

  const labels = {
    target: "Alvo",
    clipboard: "Prancheta",
    alert: "Alerta",
    calendar: "Calendário",
    tower: "Antena",
    network: "Rede",
    wrench: "Ferramenta",
    antenna: "Sinal"
  };

  const files = {
    target: "icons/target.svg",
    clipboard: "icons/clipboard.svg",
    alert: "icons/alert.svg",
    calendar: "icons/calendar.svg",
    tower: "icons/tower.svg",
    network: "icons/network.svg",
    wrench: "icons/wrench.svg",
    antenna: "icons/antenna.svg"
  };

  global.VPS_ICON_PACK = {
    id: "vps-fmds-icons-v1",
    version: "2026.07.26-v21",
    labels,
    files,
    bank: Object.fromEntries(Object.entries(svgs).map(([key, svg]) => [key, toDataUrl(svg)]))
  };
})(typeof window !== "undefined" ? window : globalThis);
