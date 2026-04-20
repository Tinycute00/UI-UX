/**
 * SVG 圖示庫 — 不使用 Emoji，符合規格書 §5 圖標規範
 * 所有圖示為 24x24 line icons (stroke-width: 2)
 */
import type { SVGProps } from "react";
import type { IconKey } from "@/lib/navigation";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (props: IconProps) => ({
  width: props.size ?? 24,
  height: props.size ?? 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...props,
});

export const IconHome = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5 10v10h5v-6h4v6h5V10" />
  </svg>
);

export const IconMorning = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="13" r="4" />
    <path d="M12 4v2M4 13H2M22 13h-2M5.6 6.6l1.4 1.4M17 8l1.4-1.4" />
    <path d="M3 20h18" />
  </svg>
);

export const IconDaily = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18M7 14h4M7 17h7" />
  </svg>
);

export const IconUpload = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 16V4m0 0-4 4m4-4 4 4" />
    <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </svg>
);

export const IconQc = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20 6 9 17l-5-5" />
    <path d="M15 3h6v6" />
  </svg>
);

export const IconSafety = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 2 4 5v7c0 4.5 3.5 8.5 8 10 4.5-1.5 8-5.5 8-10V5l-8-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const IconMaterial = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m21 8-9-5-9 5 9 5 9-5Z" />
    <path d="m3 16 9 5 9-5M3 12l9 5 9-5" />
  </svg>
);

export const IconWbs = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 3v18h18" />
    <path d="m7 17 4-6 4 3 5-8" />
  </svg>
);

export const IconOffice = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M8 8h8M8 12h8M8 16h5" />
  </svg>
);

export const IconBilling = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M6 10v4M18 10v4" />
  </svg>
);

export const IconLabor = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="7" r="3.5" />
    <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </svg>
);

export const IconReport = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 3h8l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
    <path d="M14 3v5h5M9 13h6M9 17h6" />
  </svg>
);

export const IconSettings = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
  </svg>
);

export const IconMenu = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 6h18M3 12h18M3 18h18" />
  </svg>
);

export const IconClose = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const IconBack = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M19 12H5m0 0 7 7m-7-7 7-7" />
  </svg>
);

export const IconBell = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10 21a2 2 0 0 0 4 0" />
  </svg>
);

export const IconLogout = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5M21 12H9" />
  </svg>
);

export const IconMic = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="9" y="3" width="6" height="12" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </svg>
);

export const IconCamera = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 7h4l2-3h4l2 3h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

export const IconSun = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

export const IconCloud = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M17.5 18H7a5 5 0 1 1 .8-9.94A7 7 0 0 1 21 12a6 6 0 0 1-3.5 6Z" />
  </svg>
);

export const IconWarning = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3 2 21h20L12 3Z" />
    <path d="M12 10v5M12 18v.01" />
  </svg>
);

export const IconText = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 6h16M4 12h10M4 18h16" />
  </svg>
);

const ICON_MAP: Record<IconKey, (p: IconProps) => React.ReactElement> = {
  home: IconHome,
  morning: IconMorning,
  daily: IconDaily,
  upload: IconUpload,
  qc: IconQc,
  safety: IconSafety,
  material: IconMaterial,
  wbs: IconWbs,
  office: IconOffice,
  billing: IconBilling,
  labor: IconLabor,
  report: IconReport,
  settings: IconSettings,
};

export function NavIcon({ iconKey, ...props }: IconProps & { iconKey: IconKey }) {
  const Icon = ICON_MAP[iconKey];
  return <Icon {...props} />;
}
