/**
 * 導航結構 — 單一真實來源
 * 桌面 Sidebar、手機抽屜、手機底部 TabBar 都從此衍生。
 */
import type { UserRole } from "@/lib/supabase/types";

export interface NavItem {
  href: string;
  label: string;
  iconKey: IconKey;
  /** 出現在手機底部 TabBar */
  mobileTab?: boolean;
  /** 可存取的角色，undefined = 全員 */
  allowedRoles?: UserRole[];
  /** 分組標題 */
  group?: string;
}

export type IconKey =
  | "home"
  | "morning"
  | "daily"
  | "upload"
  | "qc"
  | "safety"
  | "material"
  | "wbs"
  | "office"
  | "billing"
  | "labor"
  | "report"
  | "settings";

export const NAV: NavItem[] = [
  { href: "/today", label: "今日工作", iconKey: "home", mobileTab: true, group: "工作中心" },
  { href: "/morning-meeting", label: "早報會議", iconKey: "morning", group: "每日作業" },
  { href: "/daily-log", label: "施工日誌", iconKey: "daily", mobileTab: true, group: "每日作業" },
  { href: "/upload", label: "現場資料上傳", iconKey: "upload", mobileTab: true, group: "每日作業" },
  {
    href: "/qc",
    label: "品管檢驗",
    iconKey: "qc",
    group: "管理",
    allowedRoles: ["office_chief", "engineer", "qc_inspector", "admin_staff"],
  },
  {
    href: "/safety",
    label: "職安巡檢",
    iconKey: "safety",
    group: "管理",
    allowedRoles: ["office_chief", "engineer", "safety_officer", "admin_staff"],
  },
  { href: "/materials", label: "材料驗收", iconKey: "material", group: "管理" },
  { href: "/wbs", label: "工項 / S-Curve", iconKey: "wbs", mobileTab: true, group: "進度" },
  { href: "/office", label: "內業管理", iconKey: "office", group: "內業" },
  { href: "/billing", label: "請款管理", iconKey: "billing", group: "內業" },
  { href: "/labor", label: "路工管理", iconKey: "labor", group: "內業" },
  { href: "/reports", label: "報表中心", iconKey: "report", mobileTab: true, group: "報表" },
];

export const MOBILE_TABS = NAV.filter((n) => n.mobileTab).slice(0, 5);
