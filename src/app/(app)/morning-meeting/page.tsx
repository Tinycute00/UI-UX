"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BackButton } from "@/components/layout/BackButton";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { FormField, Input, Textarea } from "@/components/ui/Field";
import { Checkbox } from "@/components/ui/Checkbox";
import { SignaturePad, type SignaturePadHandle } from "@/components/forms/SignaturePad";
import { IconCamera } from "@/components/icons";

const attendeeSchema = z.object({
  name: z.string().min(1, "請輸入姓名"),
  signed: z.boolean().default(false),
});

const schema = z.object({
  meeting_date: z.string().min(1, "請選擇日期"),
  attendees: z.array(attendeeSchema).min(1, "至少一位出席人員"),
  discussion: z.string().min(5, "請填寫今日討論重點（至少 5 字）"),
  anomalies: z.string().optional(),
  conclusion: z.string().min(1, "請填寫會議結論"),
});

type FormValues = z.infer<typeof schema>;

const DEFAULT_ATTENDEES = [
  { name: "工務所主任", signed: false },
  { name: "工程師", signed: false },
  { name: "品管人員", signed: false },
  { name: "職安人員", signed: false },
];

export default function MorningMeetingPage() {
  const today = new Date().toISOString().split("T")[0];
  const sigRef = useRef<SignaturePadHandle>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      meeting_date: today,
      attendees: DEFAULT_ATTENDEES,
      discussion: "",
      anomalies: "",
      conclusion: "",
    },
  });

  const attendees = watch("attendees");

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setPhotos((prev) => [...prev, ...files].slice(0, 12));
    e.target.value = "";
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const signatureDataUrl = sigRef.current?.toDataURL() ?? null;
      // TODO(supabase): 接上後呼叫 `from("morning_meetings").insert(...)`，
      // 照片上傳至 `storage.from("photos")`，簽名塞入 attendees[0].signature_data_url。
      const payload = {
        meeting_date: values.meeting_date,
        attendees: values.attendees,
        discussion: values.discussion,
        anomalies: values.anomalies || null,
        conclusion: values.conclusion,
        photos: photos.map((f) => ({ name: f.name, size: f.size })),
        signatureDataUrl: signatureDataUrl ? "[redacted-base64]" : null,
      };
      // eslint-disable-next-line no-console
      console.info("[morning-meeting] submit payload", payload);
      await new Promise((r) => setTimeout(r, 500));
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <BackButton />
        <h1 className="text-2xl font-bold text-ink lg:text-3xl">早報會議</h1>
      </div>

      {submitted ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-success-500 text-3xl text-white">
              ✓
            </div>
            <h2 className="text-2xl font-bold text-ink">已成功提交</h2>
            <p className="text-lg text-ink-muted">早報會議紀錄已儲存，可於報表中心查詢</p>
            <Button
              type="button"
              size="lg"
              onClick={() => {
                setSubmitted(false);
                setPhotos([]);
                sigRef.current?.clear();
              }}
            >
              再填一筆
            </Button>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>會議資訊</CardTitle>
              <CardDescription>每日開工前填寫</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <FormField
                label="會議日期"
                required
                htmlFor="meeting_date"
                error={errors.meeting_date?.message}
              >
                <Input
                  id="meeting_date"
                  type="date"
                  {...register("meeting_date")}
                />
              </FormField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>出席人員</CardTitle>
              <CardDescription>勾選實際出席人員</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {attendees.map((a, i) => (
                <label
                  key={i}
                  className="flex items-center gap-4 rounded-xl border-2 border-surface-border bg-white px-4 py-3"
                >
                  <Checkbox
                    checked={a.signed}
                    onCheckedChange={(v) => {
                      const next = [...attendees];
                      next[i] = { ...next[i], signed: Boolean(v) };
                      setValue("attendees", next, { shouldDirty: true });
                    }}
                  />
                  <span className="text-lg font-semibold">{a.name}</span>
                </label>
              ))}
              {errors.attendees ? (
                <p className="text-base font-medium text-danger-600" role="alert">
                  {errors.attendees.message}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>會議內容</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <FormField
                label="今日討論重點"
                required
                hint="含今日施工項目、人力機具配置"
                htmlFor="discussion"
                error={errors.discussion?.message}
              >
                <Textarea id="discussion" rows={4} {...register("discussion")} />
              </FormField>
              <FormField
                label="異常狀況 / 待協調事項"
                htmlFor="anomalies"
                hint="可留白"
                error={errors.anomalies?.message}
              >
                <Textarea id="anomalies" rows={3} {...register("anomalies")} />
              </FormField>
              <FormField
                label="會議結論"
                required
                htmlFor="conclusion"
                error={errors.conclusion?.message}
              >
                <Textarea id="conclusion" rows={3} {...register("conclusion")} />
              </FormField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>現場照片</CardTitle>
              <CardDescription>最多 12 張，自動壓縮並保留 GPS</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <label className="flex min-h-touch cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-brand-300 bg-brand-50 px-4 py-4 text-lg font-semibold text-brand-700 hover:bg-brand-100">
                <IconCamera />
                <span>點此拍照 / 選取照片</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  className="hidden"
                  onChange={onPick}
                />
              </label>
              {photos.length > 0 ? (
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {photos.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 rounded-xl border-2 border-surface-border bg-white px-3 py-2"
                    >
                      <IconCamera className="text-brand-600" />
                      <span className="truncate text-base">{f.name}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>主任簽名</CardTitle>
              <CardDescription>經主任簽名後即送審</CardDescription>
            </CardHeader>
            <CardContent>
              <SignaturePad ref={sigRef} label="工務所主任簽名" />
            </CardContent>
          </Card>

          <div className="sticky bottom-24 z-10 flex flex-col gap-2 rounded-2xl border-2 border-surface-border bg-white p-4 shadow-card lg:bottom-0 lg:flex-row lg:items-center lg:justify-end lg:gap-3">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => window.history.length > 1 && window.history.back()}
            >
              取消
            </Button>
            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? "送出中..." : "提交早報"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
