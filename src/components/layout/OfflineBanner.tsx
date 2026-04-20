"use client";

import { useEffect, useState } from "react";
import { IconWarning } from "@/components/icons";

export function OfflineBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-16 z-30 flex items-center gap-2 border-b-2 border-warn-500/40 bg-warn-50 px-4 py-3 text-base font-semibold text-warn-600 lg:top-20"
    >
      <IconWarning size={22} />
      <span>目前為離線狀態，您的填寫會先儲存在本機，恢復連線後自動上傳。</span>
    </div>
  );
}
