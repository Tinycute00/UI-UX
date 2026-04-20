/**
 * Supabase — 應用程式層型別
 * 對應 supabase/migrations/0001_init.sql
 *
 * 生產建議：使用 `supabase gen types typescript` 自動生成並覆寫此檔。
 * 目前先以手寫型別方式維護以保證 Next.js 初始 build 可通過。
 */

export type UserRole =
  | "office_chief"
  | "engineer"
  | "qc_inspector"
  | "safety_officer"
  | "admin_staff";

export type WbsStatus = "planned" | "in_progress" | "completed" | "on_hold";
export type FormStatus = "draft" | "submitted" | "approved" | "rejected";
export type InspectionResult = "pass" | "fail" | "pending";

export interface PhotoMeta {
  id: string;
  url: string;
  thumb_url?: string | null;
  gps_lat?: number | null;
  gps_lng?: number | null;
  taken_at?: string | null;
  uploaded_by?: string;
}

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  phone?: string | null;
  avatar_url?: string | null;
  last_login_at?: string | null;
}

export interface Project {
  id: string;
  contract_no: string;
  name: string;
  budget_total: number;
  start_date: string;
  end_date: string;
  status: string;
}

export interface Wbs {
  id: string;
  project_id: string;
  parent_id: string | null;
  code: string;
  name: string;
  weight: number;
  planned_start: string | null;
  planned_end: string | null;
  planned_qty: number | null;
  unit: string | null;
  status: WbsStatus;
  actual_progress: number;
}

export interface MorningMeeting {
  id: string;
  project_id: string;
  meeting_date: string;
  attendees: Array<{
    user_id?: string;
    name: string;
    signed: boolean;
    signature_data_url?: string;
  }>;
  assignments: Array<{ wbs_id: string; assignee_id: string }>;
  discussion?: string | null;
  anomalies?: string | null;
  conclusion?: string | null;
  photos: PhotoMeta[];
  status: FormStatus;
  created_by: string;
  created_at: string;
}

/** Roles → permissions helper */
export const ROLE_LABELS: Record<UserRole, string> = {
  office_chief: "工務所主任",
  engineer: "工程師",
  qc_inspector: "品管人員",
  safety_officer: "職安人員",
  admin_staff: "行政人員",
};

export function canAccessModule(role: UserRole, module: string): boolean {
  // 依規格書 §10 RBAC 矩陣（簡化版：全員皆可讀）
  if (role === "office_chief") return true;
  switch (module) {
    case "daily":
    case "morning_meeting":
      return ["engineer", "qc_inspector", "safety_officer", "admin_staff"].includes(role);
    case "qc":
      return ["qc_inspector", "engineer", "admin_staff"].includes(role);
    case "safety":
      return ["safety_officer", "engineer", "admin_staff"].includes(role);
    case "materials":
    case "reports":
      return ["admin_staff", "engineer"].includes(role);
    case "wbs":
      return ["engineer", "qc_inspector", "safety_officer", "admin_staff"].includes(role);
    default:
      return true;
  }
}
