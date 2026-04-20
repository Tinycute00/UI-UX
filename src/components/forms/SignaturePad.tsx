"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/Button";

export interface SignaturePadHandle {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: () => string | null;
}

/**
 * 簽名板 — 晨會/日誌/驗收均需簽名
 * 支援手機觸控筆、桌面滑鼠。
 */
export const SignaturePad = forwardRef<
  SignaturePadHandle,
  { label?: string; onChange?: (dataUrl: string | null) => void }
>(function SignaturePad({ label = "簽名", onChange }, ref) {
  const padRef = useRef<SignatureCanvas | null>(null);

  useImperativeHandle(ref, () => ({
    clear: () => {
      padRef.current?.clear();
      onChange?.(null);
    },
    isEmpty: () => padRef.current?.isEmpty() ?? true,
    toDataURL: () =>
      padRef.current && !padRef.current.isEmpty()
        ? padRef.current.toDataURL("image/png")
        : null,
  }));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold text-ink">{label}</span>
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={() => {
            padRef.current?.clear();
            onChange?.(null);
          }}
        >
          清除重簽
        </Button>
      </div>
      <div className="signature-bg rounded-xl border-2 border-surface-border bg-white">
        <SignatureCanvas
          ref={padRef}
          penColor="#0f172a"
          canvasProps={{
            className: "w-full h-44 rounded-xl",
            "aria-label": label,
          }}
          onEnd={() => {
            const url = padRef.current?.isEmpty()
              ? null
              : (padRef.current?.toDataURL("image/png") ?? null);
            onChange?.(url);
          }}
        />
      </div>
      <p className="text-base text-ink-muted">請在上方區域手寫簽名</p>
    </div>
  );
});
