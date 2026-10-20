// Simple line icons (24x24, stroke = currentColor).
const PATHS = {
  health: <><path d="M20.8 8.6a5 5 0 0 0-8.8-3.2A5 5 0 0 0 3.2 8.6c0 5.6 8.8 11 8.8 11s8.8-5.4 8.8-11z" /><path d="M7 12h3l1.5-3 2 5 1.5-2H17" /></>,
  life: <><path d="M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9z" /><path d="M12 12v6.5a2 2 0 0 1-4 0" /><path d="M12 3v1" /></>,
  motor: <><path d="M5 16h14v-3.5l-2-4.5H7l-2 4.5V16z" /><path d="M5 12.5h14" /><circle cx="8" cy="16.5" r="1.8" /><circle cx="16" cy="16.5" r="1.8" /></>,
  travel: <><path d="M2.5 16.5l19-7.5" /><path d="M10 13.5L7 21l3-1 3.5-7.6" /><path d="M14.5 11.6L20 5.5c.7-.7.2-2-1-1.6l-7.4 3-5-1.6-1.6.8 4.2 3" /></>,
  home: <><path d="M3 11l9-7 9 7" /><path d="M5 9.5V20h14V9.5" /><path d="M10 20v-5h4v5" /></>,
  shield: <><path d="M12 3l8 3v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V6l8-3z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>,
  claim: <><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5" /><path d="M10 13h6M10 17h4" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>,
  chat: <><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.5-4.6A8 8 0 1 1 21 12z" /><path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" /></>,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  back: <path d="M19 12H5M11 6l-6 6 6 6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  x: <path d="M7 7l10 10M17 7L7 17" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  star: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  rupee: <><path d="M7 4h10M7 9h10M7 4c5 0 7 1.7 7 5s-3 5-7 5l7 6" /></>,
  headset: <><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><rect x="3" y="14" width="4" height="6" rx="1.5" /><rect x="17" y="14" width="4" height="6" rx="1.5" /></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  bolt: <path d="M13 3L5 13.5h6L10 21l8-10.5h-6z" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.3-4.3" /></>,
  grid: <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>,
  logout: <><path d="M15 4h4v16h-4" /><path d="M10 8l-4 4 4 4M6 12h10" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v4h16v-4" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c1-3.5 3.5-5 6.5-5s5.5 1.5 6.5 5" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 15c2 .7 3.2 2.4 3.5 5" /></>,
  send: <path d="M4 12l16-8-6 16-2.5-6.5z" />,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />
};

export default function Icon({ name, size = 22, className = '', strokeWidth = 1.7 }) {
  return (
    <svg className={`icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name] || PATHS.shield}
    </svg>
  );
}

/** Extra presentation data for each category slug returned by the API. */
export const CATEGORY_META = {
  health: { icon: 'health', tone: 'rose', tag: 'Cashless hospital care', short: 'Health' },
  life: { icon: 'life', tone: 'violet', tag: 'Secure your family', short: 'Term Life' },
  motor: { icon: 'motor', tone: 'blue', tag: 'Car & two-wheeler', short: 'Car & Bike' },
  travel: { icon: 'travel', tone: 'teal', tag: 'Domestic & international', short: 'Travel' },
  home: { icon: 'home', tone: 'amber', tag: 'Building and contents', short: 'Home' }
};

export const metaFor = (slug) => CATEGORY_META[slug] || { icon: 'shield', tone: 'blue', tag: '', short: slug };
