/**
 * Inkwell bespoke icon set — 24px grid, 1.6 stroke, round caps.
 * Drawn to feel hand-inked rather than generic UI glyphs.
 */
type P = { className?: string; strokeWidth?: number };

const base = (className?: string) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className,
  "aria-hidden": true,
});

export const MarkInkwell = ({ className, strokeWidth = 1.6 }: P) => (
  <svg {...base(className)} strokeWidth={strokeWidth}>
    <path d="M5 10h11a3.5 3.5 0 0 1 0 7H9a4 4 0 0 1-4-4v-3Z" />
    <path d="M16 10 19.5 4" />
    <path d="M17.6 6.9 21 8.6" />
    <path d="M8.5 13.5h4" opacity=".55" />
  </svg>
);

export const MarkSearch = ({ className, strokeWidth = 1.6 }: P) => (
  <svg {...base(className)} strokeWidth={strokeWidth}>
    <circle cx="11" cy="11" r="6" />
    <path d="m15.6 15.6 4 4" />
  </svg>
);

export const MarkPlus = ({ className, strokeWidth = 1.7 }: P) => (
  <svg {...base(className)} strokeWidth={strokeWidth}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const MarkStar = ({
  className,
  strokeWidth = 1.6,
  filled = false,
}: P & { filled?: boolean }) => (
  <svg {...base(className)} strokeWidth={strokeWidth} fill={filled ? "currentColor" : "none"}>
    <path d="M12 4.2 14 9l5.2.5-3.9 3.5 1.2 5.1L12 15.4 7.5 18.1l1.2-5.1L4.8 9.5 10 9l2-4.8Z" />
  </svg>
);

export const MarkDuplicate = ({ className, strokeWidth = 1.6 }: P) => (
  <svg {...base(className)} strokeWidth={strokeWidth}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="3" />
    <path d="M15.5 5.5h-7a3 3 0 0 0-3 3v7" />
  </svg>
);

export const MarkTrash = ({ className, strokeWidth = 1.6 }: P) => (
  <svg {...base(className)} strokeWidth={strokeWidth}>
    <path d="M4.8 7h14.4" />
    <path d="M9.5 7V5.6A1.6 1.6 0 0 1 11.1 4h1.8a1.6 1.6 0 0 1 1.6 1.6V7" />
    <path d="M6.6 7.8 7.4 18a2 2 0 0 0 2 1.9h5.2a2 2 0 0 0 2-1.9l.8-10.2" />
    <path d="M10.6 11v5M13.4 11v5" opacity=".5" />
  </svg>
);

export const MarkGrid = ({ className, strokeWidth = 1.6 }: P) => (
  <svg {...base(className)} strokeWidth={strokeWidth}>
    <rect x="4" y="4" width="7" height="7" rx="2" />
    <rect x="13" y="4" width="7" height="7" rx="2" />
    <rect x="4" y="13" width="7" height="7" rx="2" />
    <rect x="13" y="13" width="7" height="7" rx="2" />
  </svg>
);

export const MarkRows = ({ className, strokeWidth = 1.6 }: P) => (
  <svg {...base(className)} strokeWidth={strokeWidth}>
    <rect x="4" y="5" width="16" height="5" rx="2" />
    <rect x="4" y="14" width="16" height="5" rx="2" />
  </svg>
);

export const MarkSort = ({ className, strokeWidth = 1.6 }: P) => (
  <svg {...base(className)} strokeWidth={strokeWidth}>
    <path d="M6 6v12M6 18l-2.4-2.6M6 18l2.4-2.6" />
    <path d="M12 7h8M12 12h6M12 17h4" opacity=".75" />
  </svg>
);

export const MarkNib = ({ className, strokeWidth = 1.6 }: P) => (
  <svg {...base(className)} strokeWidth={strokeWidth}>
    <path d="M4.5 19.5 6 15l8.4-8.4a2.6 2.6 0 0 1 3.7 3.7L9.7 18.6l-5.2.9Z" />
    <path d="M13.2 7.8 16.9 11.5" opacity=".55" />
  </svg>
);

export const MarkSpark = ({ className, strokeWidth = 1.6 }: P) => (
  <svg {...base(className)} strokeWidth={strokeWidth}>
    <path d="M12 3.5c.7 3.7 1.6 4.6 5.3 5.3-3.7.7-4.6 1.6-5.3 5.3-.7-3.7-1.6-4.6-5.3-5.3 3.7-.7 4.6-1.6 5.3-5.3Z" />
    <path d="M17.8 15c.3 1.8.8 2.2 2.5 2.6-1.7.3-2.2.8-2.5 2.6-.3-1.8-.8-2.2-2.5-2.6 1.7-.4 2.2-.8 2.5-2.6Z" opacity=".6" />
  </svg>
);

export const MarkArchive = ({ className, strokeWidth = 1.6 }: P) => (
  <svg {...base(className)} strokeWidth={strokeWidth}>
    <path d="M4 8.5h16v8.6a2.4 2.4 0 0 1-2.4 2.4H6.4A2.4 2.4 0 0 1 4 17.1V8.5Z" />
    <rect x="3" y="4.5" width="18" height="4" rx="1.6" />
    <path d="M10 12.4h4" />
  </svg>
);
