/**
 * Inkwell icon set — hand-tuned line icons drawn on a 24px grid.
 * All icons inherit `currentColor` and scale with the `size` prop.
 */
type IconProps = { size?: number; className?: string; strokeWidth?: number };

function Svg({
  size = 20,
  className,
  strokeWidth = 1.6,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const IconPen = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20c.4-2.6 1.1-4.4 2-5.4L14.6 5a2.6 2.6 0 0 1 3.8 3.6L9.7 18c-1 1-2.9 1.7-5.7 2Z" />
    <path d="M13.4 6.3 17 9.9" />
    <path d="m6.4 14.2 3.5 3.4" />
  </Svg>
);

export const IconFountain = (p: IconProps) => (
  <Svg {...p}>
    <path d="M19 4 8.6 14.5c-.9.9-1.6 2-2 3.2L5 22l4.4-1.5c1.2-.4 2.2-1.1 3.1-2L23 8" />
    <path d="M12 12.6 15.4 16" />
    <path d="M4 8h4M2 11h4" />
  </Svg>
);

export const IconEraser = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8.6 19.4 3.9 14.7a2 2 0 0 1 0-2.8l8-8a2 2 0 0 1 2.8 0l5.4 5.4a2 2 0 0 1 0 2.8l-7.3 7.3H8.6Z" />
    <path d="m9.3 7.7 6.9 6.9" />
    <path d="M12 21h9" />
  </Svg>
);

export const IconLasso = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4.5c4.7 0 8.5 2.6 8.5 5.8 0 3.2-3.8 5.8-8.5 5.8-1.4 0-2.7-.2-3.9-.6" />
    <path d="M8.1 15.5C5.5 14.5 3.5 12.6 3.5 10.3 3.5 7.1 7.3 4.5 12 4.5" />
    <path d="M7.4 15.2c-.7 1.3-.5 2.6.6 3.4" />
    <circle cx="8.6" cy="19.8" r="1.7" />
  </Svg>
);

export const IconMarquee = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 8V6a2 2 0 0 1 2-2h2" strokeDasharray="0" />
    <path d="M16 4h2a2 2 0 0 1 2 2v2" />
    <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
    <path d="M8 20H6a2 2 0 0 1-2-2v-2" />
    <path d="M11 4h2M11 20h2M4 11v2M20 11v2" />
  </Svg>
);

export const IconHand = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 12V5.6a1.6 1.6 0 0 1 3.2 0V11" />
    <path d="M11.2 10.6V4.8a1.6 1.6 0 0 1 3.2 0v5.8" />
    <path d="M14.4 11V6.8a1.6 1.6 0 0 1 3.2 0V15c0 3.3-2.3 6-5.8 6-3 0-4.6-1.5-5.7-3.6L4 13.4c-.6-1.1 0-2.2 1.1-2.6 1-.3 1.9.1 2.4 1L8 13" />
  </Svg>
);

export const IconUndo = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 8h9.5A5.5 5.5 0 0 1 19 13.5v0A5.5 5.5 0 0 1 13.5 19H8" />
    <path d="m8 4-4 4 4 4" />
  </Svg>
);

export const IconRedo = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 8h-9.5A5.5 5.5 0 0 0 5 13.5v0A5.5 5.5 0 0 0 10.5 19H16" />
    <path d="m16 4 4 4-4 4" />
  </Svg>
);

export const IconTarget = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="6.5" />
    <circle cx="12" cy="12" r="1.6" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
  </Svg>
);

export const IconTrash = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h16" />
    <path d="M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7" />
    <path d="M6.5 7 7.3 19a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9L17.5 7" />
    <path d="M10.5 11v6M13.5 11v6" />
  </Svg>
);

export const IconPalette = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.2c5 0 8.8 3.4 8.8 7.7 0 2.6-2 4-4.2 4h-1.5c-1.2 0-2 .8-2 1.8 0 .5.2.9.5 1.3.3.4.5.8.5 1.3 0 1-.9 1.7-2.1 1.7-4.9 0-8.8-3.9-8.8-8.9S7.1 3.2 12 3.2Z" />
    <circle cx="8" cy="10" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="7.6" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="16" cy="10" r="1.1" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconSparkle = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9 12 3.5Z" />
    <path d="M18.5 16.5 19.2 18.6 21.3 19.3 19.2 20 18.5 22.1 17.8 20 15.7 19.3 17.8 18.6 18.5 16.5Z" />
  </Svg>
);

export const IconClose = (p: IconProps) => (
  <Svg {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Svg>
);

export const IconChevronLeft = (p: IconProps) => (
  <Svg {...p}>
    <path d="m14.5 5-6.5 7 6.5 7" />
  </Svg>
);

export const IconCopy = (p: IconProps) => (
  <Svg {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2.4" />
    <path d="M15 5.6A2.6 2.6 0 0 0 12.4 3H6.6A2.6 2.6 0 0 0 4 5.6v5.8A2.6 2.6 0 0 0 6.6 14" />
  </Svg>
);

export const IconFront = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="4" width="10" height="10" rx="2.2" />
    <path d="M10 20h7.5a2.5 2.5 0 0 0 2.5-2.5V10" />
    <path d="M12 8h8v8h-8z" fill="currentColor" fillOpacity="0.18" />
  </Svg>
);

export const IconBack = (p: IconProps) => (
  <Svg {...p}>
    <rect x="10" y="10" width="10" height="10" rx="2.2" />
    <path d="M14 4H6.5A2.5 2.5 0 0 0 4 6.5V14" />
  </Svg>
);

export const IconWand = (p: IconProps) => (
  <Svg {...p}>
    <path d="m4 20 10-10" />
    <path d="m14.5 5.5 4 4" />
    <path d="M13 4.2 16.2 3l-1.2 3.2L18.2 7.4 15 8.6l1.2 3.2L13 10.6 9.8 11.8 11 8.6 7.8 7.4 11 6.2 9.8 3 13 4.2Z" />
  </Svg>
);

export const IconStraight = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 19 20 5" />
    <circle cx="4" cy="19" r="2" />
    <circle cx="20" cy="5" r="2" />
  </Svg>
);

export const IconScale = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 10V4h6" />
    <path d="M20 14v6h-6" />
    <path d="M4 4l7 7M20 20l-7-7" />
  </Svg>
);

export const IconLayers = (p: IconProps) => (
  <Svg {...p}>
    <path d="m12 3 8.5 4.6L12 12.2 3.5 7.6 12 3Z" />
    <path d="m4 12 8 4.3 8-4.3" />
    <path d="m4 16.4 8 4.3 8-4.3" />
  </Svg>
);
