"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BackButton } from "@/components/layout/BackButton";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { FormField, Input, Textarea } from "@/components/ui/Field";
import { Checkbox } from "@/components/ui/Checkbox";
import { PhotoPicker, type PendingPhoto } from "@/components/forms/PhotoPicker";
import { createClient } from "@/lib/supabase/client";
import { uploadPhotos } from "@/lib/storage";
import { getActiveProject } from "@/lib/project";

const schema = z.object({
  log_date: z.string().min(1, "請選擇日期"),
  weather: z.string().min(1, "請選擇天氣"),
  temperature: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : Number(v))),
  headcount: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .pipe(z.number().int().min(0, "不可為負數").max(9999)),
  daily_wage: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : Number(v))),
  work_content: z.string().min(5, "請填寫今日工作內容（至少 5 字）"),
  tomorrow_plan: z.string().optional(),
  anomalies: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const WEATHER_OPTIONS = ["晴", "多雲", "陰", "小雨", "大雨", "颱風", "其他"];

type WbsOption = { id: string; code: string; name: string };

export default function NewDailyLogPage() {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

  const [project, setProject] = useState<{ id: string; name: string } | null>(null);
  const [wbsOptions, setWbsOptions] = useState<WbsOption[]>([]);
  const [completedWbs, setCompletedWbs] = useState<Set<string>>(new Set());
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      log_date: today,
      weather: "晴",
      temperature: "" as unknown as number,
      headcount: 0,
      daily_wage: "" as unknown as number,
      work_content: "",
      tomorrow_plan: "",
      anomalies: "",
    },
  });

  useEffect(() => {
    (async () => {
      const p = await getActiveProject();
      setProject(p);
      if (!p) return;
      const supabase = createClient();
      const { data } = await supabase
        .from("wbs")
        .select("id, code, name")
        .eq("project_id", p.id)
        .order("code", { ascending: true });
      setWbsOptions((data ?? []) as WbsOption[]);
    })();
  }, []);

  const toggleWbs = (id: string) => {
    setCompletedWbs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const wbsByCode = useMemo(
    () => [...wbsOptions].sort((a, b) => a.code.localeCompare(b.code)),
    [wbsOptions],
  );

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createClient();
      if (!project) throw new Error("尚未設定專案，請先於 Supabase 建立 projects 資料");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("請先登入");

      const completed = Array.from(completedWbs);

      const { data: inserted, error: insErr } = await supabase
        .from("daily_logs")
        .insert({
          project_id: project.id,
          log_date: values.log_date,
          weather: values.weather,
          temperature: values.temperature,
          headcount: values.headcount,
          daily_wage: values.daily_wage,
          completed_wbs_ids: completed,
          work_content: values.work_content,
          tomorrow_plan: values.tomorrow_plan || null,
          anomalies: values.anomalies || null,
          status: "submitted",
          created_by: user.id,
        })
        .select()
        .maybeSingle();
      if (insErr) throw insErr;

      if (photos.length > 0 && inserted?.id) {
        setUploadProgress({ done: 0, total: photos.length });
        await uploadPhotos({
          files: photos.map((p) => p.file),
          projectId: project.id,
          linkedType: "daily_log",
          linkedId: inserted.id as string,
          onProgress: (done, total) => setUploadProgress({ done, total }),
        });
      }

      setSubmitted(true);
      setTimeout(() => router.push("/daily-log"), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "提交失敗");
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <BackButton />
        <h1 className="text-2xl font-bold text-ink lg:text-3xl">新增施工日誌</h1>
      </div>

      {submitted ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-success-500 text-3xl text-white">
              ✓
            </div>
            <h2 className="text-2xl font-bold text-ink">日誌已提交</h2>
            <p className="text-lg text-ink-muted">勾選工項已觸發 S-Curve 自動更新</p>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>基本資訊</CardTitle>
              {project ? (
                <CardDescription>
                  專案：<b>{project.name}</b>
                </CardDescription>
              ) : (
                <CardDescription className="text-warn-700">
                  尚未連線到專案（Supabase 未設定或未登入），提交將失敗但可檢視表單
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                label="日期"
                required
                htmlFor="log_date"
                error={errors.log_date?.message}
              >
                <Input id="log_date" type="date" {...register("log_date")} />
              </FormField>
              <FormField
                label="天氣"
                required
                htmlFor="weather"
                error={errors.weather?.message}
              >
                <select
                  id="weather"
                  {...register("weather")}
                  className="h-14 w-full rounded-xl border-2 border-surface-border bg-white px-4 text-lg focus:border-brand-500 focus:outline-none"
                >
                  {WEATHER_OPTIONS.map((w) => (
                    <option key={w}>{w}</option>
                  ))}
                </select>
              </FormField>
              <FormField
                label="溫度 (°C)"
                htmlFor="temperature"
                hint="可留白"
                error={errors.temperature?.message}
              >
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  {...register("temperature")}
                />
              </FormField>
              <FormField
                label="出工人數"
                required
                htmlFor="headcount"
                error={errors.headcount?.message}
              >
                <Input
                  id="headcount"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  {...register("headcount")}
                />
              </FormField>
              <FormField
                label="當日工資率 (元)"
                htmlFor="daily_wage"
                hint="可留白；用於預算執行率試算"
                error={errors.daily_wage?.message}
              >
                <Input
                  id="daily_wage"
                  type="number"
                  min={0}
                  step="1"
                  inputMode="numeric"
                  {...register("daily_wage")}
                />
              </FormField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>完成工項（勾選）</CardTitle>
              <CardDescription>
                勾選後系統自動呼叫 <code className="rounded bg-surface-muted px-1">recalculate_wbs_progress</code>
                更新 S-Curve
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {wbsByCode.length === 0 ? (
                <p className="rounded-xl bg-surface-muted p-4 text-base text-ink-muted">
                  尚無工項（請先於 WBS 模組建立工項或匯入 CSV）
                </p>
              ) : (
                wbsByCode.map((w) => (
                  <label
                    key={w.id}
                    className="flex items-center gap-4 rounded-xl border-2 border-surface-border bg-white px-4 py-3 hover:border-brand-400"
                  >
                    <Checkbox
                      checked={completedWbs.has(w.id)}
                      onCheckedChange={() => toggleWbs(w.id)}
                    />
                    <span className="font-mono text-base text-brand-700">{w.code}</span>
                    <span className="text-lg font-semibold">{w.name}</span>
                  </label>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>工作內容</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <FormField
                label="今日施作內容"
                required
                htmlFor="work_content"
                error={errors.work_content?.message}
              >
                <Textarea id="work_content" rows={4} {...register("work_content")} />
              </FormField>
              <FormField
                label="明日工作計畫"
                htmlFor="tomorrow_plan"
                hint="可留白"
                error={errors.tomorrow_plan?.message}
              >
                <Textarea id="tomorrow_plan" rows={3} {...register("tomorrow_plan")} />
              </FormField>
              <FormField
                label="異常狀況"
                htmlFor="anomalies"
                hint="如停工、災害、糾紛等（可留白）"
                error={errors.anomalies?.message}
              >
                <Textarea id="anomalies" rows={3} {...register("anomalies")} />
              </FormField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>現場照片</CardTitle>
              <CardDescription>
                自動壓縮至 ≤1.5MB，保留 EXIF GPS / 拍攝時間，最多 12 張
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PhotoPicker value={photos} onChange={setPhotos} max={12} />
            </CardContent>
          </Card>

          {error ? (
            <div
              role="alert"
              className="rounded-xl border-2 border-danger-500/40 bg-danger-50 px-4 py-3 text-base font-semibold text-danger-700"
            >
              {error}
            </div>
          ) : null}

          {uploadProgress ? (
            <div className="rounded-xl border-2 border-brand-300 bg-brand-50 px-4 py-3 text-base font-semibold text-brand-700">
              上傳中 {uploadProgress.done}/{uploadProgress.total}…
            </div>
          ) : null}

          <div className="sticky bottom-24 z-10 flex flex-col gap-2 rounded-2xl border-2 border-surface-border bg-white p-4 shadow-card lg:bottom-0 lg:flex-row lg:items-center lg:justify-end lg:gap-3">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => router.back()}
            >
              取消
            </Button>
            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? "提交中…" : "提交日誌"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
