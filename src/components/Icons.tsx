interface IconProps {
  size?: number;
  className?: string;
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
});

export const IconClose = ({ size = 20 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const IconBack = ({ size = 20 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

export const IconSearch = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </svg>
);

export const IconFilter = ({ size = 17 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M3 5h18M6 12h12M10 19h4" />
  </svg>
);

export const IconCrosshair = ({ size = 20 }: IconProps) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="7" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
  </svg>
);

export const IconLayers = ({ size = 20 }: IconProps) => (
  <svg {...base(size)}>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3 14 9 5 9-5" />
  </svg>
);

export const IconPhone = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M6.6 3h-2A1.6 1.6 0 0 0 3 4.7C3 13.1 10.9 21 19.3 21a1.6 1.6 0 0 0 1.7-1.6v-2a1.6 1.6 0 0 0-1.3-1.6l-2.6-.5a1.6 1.6 0 0 0-1.6.7l-.8 1.2a13 13 0 0 1-5.9-5.9l1.2-.8a1.6 1.6 0 0 0 .7-1.6l-.5-2.6A1.6 1.6 0 0 0 6.6 3Z" />
  </svg>
);

export const IconClock = ({ size = 14 }: IconProps) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const IconRoute = ({ size = 14 }: IconProps) => (
  <svg {...base(size)}>
    <circle cx="6" cy="19" r="2.5" />
    <circle cx="18" cy="5" r="2.5" />
    <path d="M8.5 19h5a4 4 0 0 0 0-8h-3a4 4 0 0 1 0-8h5" />
  </svg>
);

export const IconPin = ({ size = 16 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.6" />
  </svg>
);

export const IconPlus = ({ size = 20 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconCheck = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="m4 12.5 5 5L20 6.5" />
  </svg>
);

export const IconArrowRight = ({ size = 17 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
);

export const IconChevronDown = ({ size = 18, className }: IconProps) => (
  <svg {...base(size)} className={className}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const IconChevronUp = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="m6 15 6-6 6 6" />
  </svg>
);

export const IconArchive = ({ size = 17 }: IconProps) => (
  <svg {...base(size)}>
    <rect x="3" y="4" width="18" height="4" rx="1.5" />
    <path d="M5 8v11a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19V8" />
    <path d="M10 12h4" />
  </svg>
);

export const IconTrash = ({ size = 17 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    <path d="M6 7v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" />
  </svg>
);

export const IconRefresh = ({ size = 17 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M20 11a8 8 0 0 0-14-4.5L4 9" />
    <path d="M4 5v4h4" />
    <path d="M4 13a8 8 0 0 0 14 4.5L20 15" />
    <path d="M20 19v-4h-4" />
  </svg>
);

export const IconBasket = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M4 9h16l-1.4 9.2a2 2 0 0 1-2 1.8H7.4a2 2 0 0 1-2-1.8L4 9Z" />
    <path d="m8 9 2.5-5M16 9l-2.5-5" />
  </svg>
);

export const IconLeaf = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M4 20c0-8 6-14 16-15 0 10-5 15-12 15H4Z" />
    <path d="M4 20c3-5 6-8 10-10" />
  </svg>
);

/* A toolbox: neutral across chemicals, seed, water and machinery alike. */
export const IconService = ({ size = 17 }: IconProps) => (
  <svg {...base(size)}>
    <rect x="3" y="8" width="18" height="12" rx="2.5" />
    <path d="M9 8V6.2A2.2 2.2 0 0 1 11.2 4h1.6A2.2 2.2 0 0 1 15 6.2V8" />
    <path d="M3 13.5h18" />
  </svg>
);

export const IconShield = ({ size = 15 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M12 3 5 6v6c0 4.5 3 8 7 9 4-1 7-4.5 7-9V6l-7-3Z" />
  </svg>
);

export const IconInfo = ({ size = 15 }: IconProps) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
);

export const IconHelp = ({ size = 20 }: IconProps) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.2 9.3a2.9 2.9 0 0 1 5.6 1c0 1.9-2.8 2.4-2.8 4" />
    <path d="M12 17.5h.01" />
  </svg>
);

export const IconWarn = ({ size = 16 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M10.3 4.3 2.6 17.6A2 2 0 0 0 4.3 20.6h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 16.5h.01" />
  </svg>
);

/*
 * The three messengers.
 *
 * Solid glyphs rather than outlines, because these are marks people recognise
 * by silhouette and an outlined WhatsApp is not a WhatsApp. They take their
 * colour from the button like every other icon here, so one file is not
 * carrying three brand palettes around.
 */
const solid = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'currentColor',
  'aria-hidden': true,
});

export const IconWhatsApp = ({ size = 18 }: IconProps) => (
  <svg {...solid(size)}>
    <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.48 1.34 5L2 22l5.18-1.36a9.93 9.93 0 0 0 4.86 1.24h.01c5.5 0 9.96-4.46 9.96-9.96 0-2.66-1.04-5.16-2.92-7.04A9.88 9.88 0 0 0 12.04 2Zm0 18.15h-.01a8.27 8.27 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.24 8.24 0 0 1-1.27-4.41c0-4.56 3.72-8.27 8.28-8.27 2.21 0 4.29.86 5.85 2.43a8.22 8.22 0 0 1 2.42 5.85c0 4.56-3.71 8.26-8.28 8.26Zm4.54-6.19c-.25-.13-1.47-.73-1.7-.81-.23-.08-.4-.13-.56.12-.17.25-.64.81-.79.98-.14.16-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.14.17-.25.25-.41.09-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.87.86-.87 2.09s.9 2.43 1.02 2.6c.12.16 1.76 2.69 4.26 3.77.6.26 1.06.41 1.42.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.19.21-.58.21-1.08.15-1.18-.06-.11-.23-.17-.48-.29Z" />
  </svg>
);

export const IconViber = ({ size = 18 }: IconProps) => (
  <svg {...solid(size)}>
    <path d="M12.3 2c-2.1 0-4.9.25-6.5 1.7C4.6 4.8 4.2 6.5 4.15 8.6c-.05 2.1-.1 6.03 3.68 7.1v1.62c0 .6 0 1.2.02 1.48.03.42.08.86.4 1.05.32.19.68.05.98-.15.23-.15 1.4-1.3 2.36-2.24h.4c2.1 0 3.75-.13 5.23-.6 1.62-.53 2.72-2.03 2.98-4.03.13-1 .17-2 .12-3.01-.06-2.1-.45-3.8-1.65-4.9C17.07 2.25 14.4 2 12.3 2Zm0 1.5c1.96 0 4.35.25 5.4 1.2.86.78 1.15 2.13 1.2 3.9.04.92 0 1.84-.11 2.75-.2 1.5-.95 2.5-2 2.84-1.27.4-2.8.52-4.79.52h-.7a.75.75 0 0 0-.53.22c-.7.68-1.63 1.6-2.15 2.1v-1.5a.75.75 0 0 0-.6-.73C4.9 13.98 5.6 10.8 5.65 8.64c.04-1.77.33-3.12 1.2-3.9 1.05-.95 3.5-1.24 5.45-1.24Zm.35 1.86a.6.6 0 0 0-.05 1.2c1.5.1 2.63.53 3.4 1.35.77.82 1.14 1.94 1.13 3.4a.6.6 0 1 0 1.2.01c.01-1.68-.43-3.11-1.46-4.2-1.03-1.1-2.44-1.6-4.15-1.73a.6.6 0 0 0-.07 0Zm-3.2 1.1a.93.93 0 0 0-.6.21c-.36.29-.93.87-1.06 1.5-.1.5.03 1 .3 1.6.55 1.2 1.4 2.4 2.36 3.35.95.95 2.15 1.8 3.35 2.36.6.27 1.1.4 1.6.3.63-.13 1.21-.7 1.5-1.06.3-.38.24-.82-.08-1.08-.24-.2-1.23-.87-1.55-1.05-.36-.2-.72-.1-.93.16l-.44.56c-.2.25-.44.22-.44.22s-1.06-.36-2.02-1.32c-.96-.96-1.32-2.02-1.32-2.02s-.03-.24.22-.44l.56-.44c.26-.21.36-.57.16-.93-.18-.32-.85-1.31-1.05-1.55a.68.68 0 0 0-.56-.37Zm3.34.99a.6.6 0 0 0-.1 1.2c.66.11 1.08.33 1.35.6.26.27.48.7.6 1.35a.6.6 0 1 0 1.18-.21c-.16-.88-.5-1.6-1.03-2.13-.53-.53-1.25-.87-2.13-1.03a.6.6 0 0 0-.1 0h.23Zm.1 2.06a.6.6 0 0 0-.16 1.19c.28.05.4.12.46.18.06.06.13.18.18.46a.6.6 0 1 0 1.18-.22c-.09-.48-.27-.93-.62-1.28-.35-.35-.8-.53-1.28-.62a.6.6 0 0 0-.1-.01l.34.3Z" />
  </svg>
);

export const IconTelegram = ({ size = 18 }: IconProps) => (
  <svg {...solid(size)}>
    <path d="M21.7 4.4 18.5 19.6c-.24 1.06-.87 1.32-1.77.82l-4.9-3.6-2.36 2.27c-.26.26-.48.48-.99.48l.35-5 9.1-8.22c.4-.35-.09-.55-.62-.2L5.05 12.23.2 10.72c-1.05-.33-1.07-1.05.22-1.56L20.34 3.4c.88-.33 1.64.2 1.36 1Z" />
  </svg>
);
