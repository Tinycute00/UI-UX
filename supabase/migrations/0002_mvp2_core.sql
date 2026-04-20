-- ============================================================================
-- Migration 0002 — MVP 2 核心擴充
-- Scope: Storage bucket (photos), profile auto-provision on signup,
--        trigger：daily_logs 提交後自動觸發 WBS 進度重算
-- ============================================================================

-- ---------- Storage bucket：photos ----------
-- Supabase Storage 須建立 bucket；若已存在則不動作
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

-- RLS：只允許已登入使用者存取自己專案的 photos
-- 物件路徑規範：{project_id}/{uuid}-{原檔名}
drop policy if exists "photos_project_members_read" on storage.objects;
create policy "photos_project_members_read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'photos'
    and public.is_project_member((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "photos_project_members_write" on storage.objects;
create policy "photos_project_members_write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'photos'
    and public.is_project_member((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "photos_project_members_delete" on storage.objects;
create policy "photos_project_members_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'photos'
    and public.is_project_member((storage.foldername(name))[1]::uuid)
  );

-- ---------- profiles 自動建立：新使用者註冊後 ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), '使用者'),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'admin_staff')
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- daily_logs 提交後觸發 WBS 進度重算 ----------
create or replace function public.trg_daily_log_recalc_wbs()
returns trigger language plpgsql as $$
declare w uuid;
begin
  if new.completed_wbs_ids is null then return new; end if;
  foreach w in array new.completed_wbs_ids loop
    perform public.recalculate_wbs_progress(w);
  end loop;
  return new;
end; $$;

drop trigger if exists trg_dl_after_insupd on public.daily_logs;
create trigger trg_dl_after_insupd
  after insert or update on public.daily_logs
  for each row execute function public.trg_daily_log_recalc_wbs();

-- ---------- S-Curve 聚合：日粒度 planned vs actual ----------
-- view：以專案日期序列回傳每日 planned / actual 累積 %
create or replace function public.scurve_series(p_project uuid)
returns table(date date, planned numeric, actual numeric)
language sql stable security definer as $$
  with proj as (
    select start_date, end_date from public.projects where id = p_project
  ),
  days as (
    select generate_series(
      (select start_date from proj),
      (select end_date from proj),
      interval '1 day'
    )::date as d
  ),
  total_weight as (
    select greatest(sum(weight), 1) as w from public.wbs
    where project_id = p_project and parent_id is null
  ),
  planned_daily as (
    select
      d.d,
      coalesce(sum(
        case
          when w.planned_start is null or w.planned_end is null then 0
          when d.d < w.planned_start then 0
          when d.d >= w.planned_end then w.weight
          else w.weight * (d.d - w.planned_start)::numeric
                       / nullif((w.planned_end - w.planned_start)::numeric, 0)
        end
      ), 0) as planned_cum
    from days d
    cross join public.wbs w
    where w.project_id = p_project and w.parent_id is null
    group by d.d
  ),
  actual_daily as (
    -- 以 daily_logs 的累積 actual_progress（取當日之前最近一筆 WBS 狀態近似）
    -- 簡化：用每日 log 勾選的 WBS 權重累加
    select d.d,
      coalesce((
        select sum(w.weight * (w.actual_progress / 100.0))
        from public.wbs w
        where w.project_id = p_project and w.parent_id is null
          and exists (
            select 1 from public.daily_logs dl
            where dl.project_id = p_project
              and dl.log_date <= d.d
              and w.id = any(dl.completed_wbs_ids)
          )
      ), 0) as actual_cum
    from days d
  )
  select
    p.d as date,
    round((p.planned_cum / (select w from total_weight) * 100)::numeric, 2) as planned,
    round((coalesce(a.actual_cum, 0) / (select w from total_weight) * 100)::numeric, 2) as actual
  from planned_daily p
  left join actual_daily a on a.d = p.d
  order by p.d;
$$;

-- ============================================================================
-- 完成
-- ============================================================================
