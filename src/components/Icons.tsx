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

export const IconWarn = ({ size = 16 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M10.3 4.3 2.6 17.6A2 2 0 0 0 4.3 20.6h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 16.5h.01" />
  </svg>
);
