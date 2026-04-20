-- ============================================================================
-- 公共工程甲級營造廠工務所管理系統 — 初始化 Schema (Supabase / Postgres)
-- ============================================================================
-- Scope: Project, WBS, User(profile), 表單（DailyLog / MorningMeeting /
--   Inspection / SafetyCheck / MaterialReceipt）, Photo, AuditLog
-- RBAC：role 驅動的 Row Level Security
-- 執行方式：supabase db push 或 Dashboard → SQL Editor 貼上執行
-- ============================================================================

-- 啟用必要擴充
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ============================================================================
-- ENUM
-- ============================================================================
do $$ begin
  create type user_role as enum (
    'office_chief',   -- 工務所主任
    'engineer',       -- 工程師
    'qc_inspector',   -- 品管人員
    'safety_officer', -- 職安人員
    'admin_staff'     -- 行政人員
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type wbs_status as enum ('planned', 'in_progress', 'completed', 'on_hold');
exception when duplicate_object then null; end $$;

do $$ begin
  create type form_status as enum ('draft', 'submitted', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type inspection_result as enum ('pass', 'fail', 'pending');
exception when duplicate_object then null; end $$;

-- ============================================================================
-- profiles：對應 auth.users，存放應用層使用者欄位
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role user_role not null default 'admin_staff',
  phone text,
  avatar_url text,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- projects：專案
-- ============================================================================
create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  contract_no text not null unique,
  name text not null,
  budget_total numeric(18, 2) not null default 0,
  start_date date not null,
  end_date date not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 專案成員（多對多）
create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role user_role not null,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

-- ============================================================================
-- WBS：工項（樹狀結構）
-- ============================================================================
create table if not exists public.wbs (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  parent_id uuid references public.wbs(id) on delete cascade,
  code text not null,
  name text not null,
  weight numeric(6, 3) not null default 0,           -- 權重 (0-100)
  planned_start date,
  planned_end date,
  planned_qty numeric(18, 3),                        -- 計畫數量（數量型工項）
  unit text,                                         -- 單位
  status wbs_status not null default 'planned',
  actual_progress numeric(5, 2) not null default 0,  -- 0-100，自動計算
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, code)
);
create index if not exists wbs_project_idx on public.wbs(project_id);
create index if not exists wbs_parent_idx on public.wbs(parent_id);

-- ============================================================================
-- 晨會 morning_meetings
-- ============================================================================
create table if not exists public.morning_meetings (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  meeting_date date not null,
  attendees jsonb not null default '[]'::jsonb,      -- [{user_id, name, signed, signature_data_url}]
  assignments jsonb not null default '[]'::jsonb,    -- [{wbs_id, assignee_id}]
  discussion text,
  anomalies text,
  conclusion text,
  photos jsonb not null default '[]'::jsonb,         -- Photo[]
  status form_status not null default 'submitted',
  created_by uuid not null references public.profiles(id),
  approved_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists mm_project_date_idx on public.morning_meetings(project_id, meeting_date desc);

-- ============================================================================
-- 每日施工日誌 daily_logs
-- ============================================================================
create table if not exists public.daily_logs (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  log_date date not null,
  weather text,
  temperature numeric(4, 1),
  headcount integer not null default 0,
  daily_wage numeric(10, 2),                         -- 當日工資率（用於預算執行率）
  completed_wbs_ids uuid[] not null default '{}',
  work_content text,
  tomorrow_plan text,
  anomalies text,
  photos jsonb not null default '[]'::jsonb,
  status form_status not null default 'submitted',
  created_by uuid not null references public.profiles(id),
  approved_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, log_date)
);
create index if not exists dl_project_date_idx on public.daily_logs(project_id, log_date desc);

-- ============================================================================
-- 品管檢驗 inspections
-- ============================================================================
create table if not exists public.inspections (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  wbs_id uuid not null references public.wbs(id) on delete cascade,
  inspection_date date not null,
  items jsonb not null default '[]'::jsonb,          -- [{name, result, note}]
  result inspection_result not null default 'pending',
  remarks text,
  photos jsonb not null default '[]'::jsonb,
  report_url text,
  status form_status not null default 'submitted',
  created_by uuid not null references public.profiles(id),
  approved_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists insp_project_date_idx on public.inspections(project_id, inspection_date desc);
create index if not exists insp_wbs_idx on public.inspections(wbs_id);

-- ============================================================================
-- 職安巡檢 safety_checks
-- ============================================================================
create table if not exists public.safety_checks (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  check_date date not null,
  items jsonb not null default '[]'::jsonb,          -- [{name, checked, issue?}]
  defects text,
  photos jsonb not null default '[]'::jsonb,
  status form_status not null default 'submitted',
  created_by uuid not null references public.profiles(id),
  approved_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists sc_project_date_idx on public.safety_checks(project_id, check_date desc);

-- ============================================================================
-- 材料驗收 material_receipts
-- ============================================================================
create table if not exists public.material_receipts (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  wbs_id uuid references public.wbs(id) on delete set null,
  receipt_date date not null,
  material_name text not null,
  quantity numeric(18, 3) not null,
  unit text not null,
  unit_price numeric(14, 2) not null default 0,
  total_amount numeric(18, 2) generated always as (quantity * unit_price) stored,
  supplier text,
  batch_no text,
  passed boolean not null default false,
  photos jsonb not null default '[]'::jsonb,
  status form_status not null default 'submitted',
  created_by uuid not null references public.profiles(id),
  approved_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists mr_project_date_idx on public.material_receipts(project_id, receipt_date desc);
create index if not exists mr_wbs_idx on public.material_receipts(wbs_id);

-- ============================================================================
-- 照片 photos（集中表，供跨模組查詢）
-- ============================================================================
create table if not exists public.photos (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  url text not null,
  thumb_url text,
  gps_lat numeric(10, 7),
  gps_lng numeric(10, 7),
  taken_at timestamptz,
  size_bytes integer,
  mime_type text,
  uploaded_by uuid not null references public.profiles(id),
  linked_type text,                                  -- 'morning_meeting' | 'daily_log' | ...
  linked_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists photos_project_idx on public.photos(project_id);
create index if not exists photos_linked_idx on public.photos(linked_type, linked_id);

-- ============================================================================
-- 審計日誌 audit_logs
-- ============================================================================
create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_entity_idx on public.audit_logs(entity_type, entity_id);
create index if not exists audit_user_idx on public.audit_logs(user_id, created_at desc);

-- ============================================================================
-- 觸發器：updated_at 自動更新
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end; $$;

do $$
declare t text;
begin
  for t in select unnest(array[
    'profiles','projects','wbs','morning_meetings','daily_logs',
    'inspections','safety_checks','material_receipts'
  ]) loop
    execute format(
      'drop trigger if exists trg_%1$s_updated_at on public.%1$s;
       create trigger trg_%1$s_updated_at before update on public.%1$s
       for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- ============================================================================
-- 輔助函式：取得目前使用者角色
-- ============================================================================
create or replace function public.current_user_role()
returns user_role language sql stable security definer as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_project_member(p_project uuid)
returns boolean language sql stable security definer as $$
  select exists(
    select 1 from public.project_members
    where project_id = p_project and user_id = auth.uid()
  );
$$;

-- ============================================================================
-- Row Level Security（RBAC）
-- ============================================================================
alter table public.profiles           enable row level security;
alter table public.projects           enable row level security;
alter table public.project_members    enable row level security;
alter table public.wbs                enable row level security;
alter table public.morning_meetings   enable row level security;
alter table public.daily_logs         enable row level security;
alter table public.inspections        enable row level security;
alter table public.safety_checks      enable row level security;
alter table public.material_receipts  enable row level security;
alter table public.photos             enable row level security;
alter table public.audit_logs         enable row level security;

-- profiles：本人可讀寫自己；主任可讀全部
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles
  for select using (auth.uid() = id or public.current_user_role() = 'office_chief');

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
  for update using (auth.uid() = id);

-- projects：成員可讀；主任可寫
drop policy if exists projects_member_read on public.projects;
create policy projects_member_read on public.projects
  for select using (public.is_project_member(id) or public.current_user_role() = 'office_chief');

drop policy if exists projects_chief_write on public.projects;
create policy projects_chief_write on public.projects
  for all using (public.current_user_role() = 'office_chief')
  with check (public.current_user_role() = 'office_chief');

-- project_members：本人可讀自己；主任可讀寫
drop policy if exists pm_self_read on public.project_members;
create policy pm_self_read on public.project_members
  for select using (user_id = auth.uid() or public.current_user_role() = 'office_chief');

drop policy if exists pm_chief_write on public.project_members;
create policy pm_chief_write on public.project_members
  for all using (public.current_user_role() = 'office_chief')
  with check (public.current_user_role() = 'office_chief');

-- WBS：成員可讀；工程師/主任可寫
drop policy if exists wbs_member_read on public.wbs;
create policy wbs_member_read on public.wbs
  for select using (public.is_project_member(project_id));

drop policy if exists wbs_engineer_write on public.wbs;
create policy wbs_engineer_write on public.wbs
  for all using (
    public.is_project_member(project_id)
    and public.current_user_role() in ('office_chief', 'engineer')
  ) with check (
    public.is_project_member(project_id)
    and public.current_user_role() in ('office_chief', 'engineer')
  );

-- 通用表單 policy 範本：成員可讀；建立者可寫；主任可 approve
-- morning_meetings
drop policy if exists mm_member_read on public.morning_meetings;
create policy mm_member_read on public.morning_meetings
  for select using (public.is_project_member(project_id));
drop policy if exists mm_write on public.morning_meetings;
create policy mm_write on public.morning_meetings
  for all using (
    public.is_project_member(project_id)
    and (created_by = auth.uid() or public.current_user_role() = 'office_chief')
  ) with check (public.is_project_member(project_id));

-- daily_logs
drop policy if exists dl_member_read on public.daily_logs;
create policy dl_member_read on public.daily_logs
  for select using (public.is_project_member(project_id));
drop policy if exists dl_write on public.daily_logs;
create policy dl_write on public.daily_logs
  for all using (
    public.is_project_member(project_id)
    and (created_by = auth.uid() or public.current_user_role() in ('office_chief','engineer'))
  ) with check (public.is_project_member(project_id));

-- inspections（品管人員）
drop policy if exists insp_member_read on public.inspections;
create policy insp_member_read on public.inspections
  for select using (public.is_project_member(project_id));
drop policy if exists insp_write on public.inspections;
create policy insp_write on public.inspections
  for all using (
    public.is_project_member(project_id)
    and public.current_user_role() in ('office_chief','qc_inspector')
  ) with check (public.is_project_member(project_id));

-- safety_checks（職安人員）
drop policy if exists sc_member_read on public.safety_checks;
create policy sc_member_read on public.safety_checks
  for select using (public.is_project_member(project_id));
drop policy if exists sc_write on public.safety_checks;
create policy sc_write on public.safety_checks
  for all using (
    public.is_project_member(project_id)
    and public.current_user_role() in ('office_chief','safety_officer')
  ) with check (public.is_project_member(project_id));

-- material_receipts（行政/主任）
drop policy if exists mr_member_read on public.material_receipts;
create policy mr_member_read on public.material_receipts
  for select using (public.is_project_member(project_id));
drop policy if exists mr_write on public.material_receipts;
create policy mr_write on public.material_receipts
  for all using (
    public.is_project_member(project_id)
    and public.current_user_role() in ('office_chief','admin_staff','engineer')
  ) with check (public.is_project_member(project_id));

-- photos
drop policy if exists photos_member_read on public.photos;
create policy photos_member_read on public.photos
  for select using (public.is_project_member(project_id));
drop policy if exists photos_write on public.photos;
create policy photos_write on public.photos
  for all using (
    public.is_project_member(project_id)
    and (uploaded_by = auth.uid() or public.current_user_role() = 'office_chief')
  ) with check (public.is_project_member(project_id));

-- audit_logs：只讀，主任可讀
drop policy if exists audit_chief_read on public.audit_logs;
create policy audit_chief_read on public.audit_logs
  for select using (public.current_user_role() = 'office_chief');

-- ============================================================================
-- 進度計算：表單提交後自動更新 WBS actual_progress
-- ============================================================================
create or replace function public.recalculate_wbs_progress(p_wbs uuid)
returns void language plpgsql security definer as $$
declare
  v_project uuid;
  v_has_children boolean;
  v_planned_qty numeric;
  v_received_qty numeric;
  v_insp_all_pass boolean;
  v_in_any_daily_log boolean;
  v_new_progress numeric := 0;
begin
  select project_id, planned_qty into v_project, v_planned_qty from public.wbs where id = p_wbs;
  if not found then return; end if;

  select exists(select 1 from public.wbs where parent_id = p_wbs) into v_has_children;

  if v_has_children then
    -- 複合型：子 WBS 加權平均
    select coalesce(
      sum(actual_progress * weight) / nullif(sum(weight), 0), 0
    ) into v_new_progress
    from public.wbs where parent_id = p_wbs;
  elsif v_planned_qty is not null and v_planned_qty > 0 then
    -- 數量型
    select coalesce(sum(quantity), 0) into v_received_qty
      from public.material_receipts
      where wbs_id = p_wbs and passed = true;
    v_new_progress := least(100, (v_received_qty / v_planned_qty) * 100);
  else
    -- 原子工項：日誌勾選 + 檢驗全合格 → 100
    select exists(
      select 1 from public.daily_logs
      where project_id = v_project and p_wbs = any(completed_wbs_ids)
    ) into v_in_any_daily_log;

    select coalesce(bool_and(result = 'pass'), true) into v_insp_all_pass
    from public.inspections where wbs_id = p_wbs;

    if v_in_any_daily_log and v_insp_all_pass then
      v_new_progress := 100;
    else
      v_new_progress := case when v_in_any_daily_log then 50 else 0 end;
    end if;
  end if;

  update public.wbs set actual_progress = v_new_progress where id = p_wbs;

  -- 向上傳遞
  update public.wbs set actual_progress = (
    select coalesce(sum(child.actual_progress * child.weight) / nullif(sum(child.weight),0), 0)
    from public.wbs child where child.parent_id = public.wbs.id
  ) where id = (select parent_id from public.wbs where id = p_wbs) and parent_id is not null;
end; $$;

-- ============================================================================
-- Storage bucket：photos（需在 Dashboard 手動建立，或用下列 SQL）
-- ============================================================================
-- insert into storage.buckets (id, name, public) values ('photos', 'photos', false)
-- on conflict (id) do nothing;

-- ============================================================================
-- 完成
-- ============================================================================
