"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type FontScale = "normal" | "large" | "xlarge";
type Contrast = "normal" | "high";

interface A11yState {
  fontScale: FontScale;
  contrast: Contrast;
  setFontScale: (s: FontScale) => void;
  setContrast: (c: Contrast) => void;
  cycleFontScale: () => void;
  toggleContrast: () => void;
}

const FONT_SCALE_VALUE: Record<FontScale, string> = {
  normal: "1",
  large: "1.15",
  xlarge: "1.3",
};

const FONT_SCALE_LABEL: Record<FontScale, string> = {
  normal: "標準",
  large: "大字",
  xlarge: "特大字",
};

const A11yContext = createContext<A11yState | null>(null);

export function A11yProvider({ children }: { children: ReactNode }) {
  const [fontScale, setFontScaleState] = useState<FontScale>("normal");
  const [contrast, setContrastState] = useState<Contrast>("normal");

  // 持久化
  useEffect(() => {
    try {
      const f = localStorage.getItem("a11y:font") as FontScale | null;
      const c = localStorage.getItem("a11y:contrast") as Contrast | null;
      if (f) setFontScaleState(f);
      if (c) setContrastState(c);
    } catch {
      /* noop */
    }
  }, []);

  // 套用到 root
  useEffect(() => {
    document.documentElement.style.setProperty("--font-scale", FONT_SCALE_VALUE[fontScale]);
    document.documentElement.setAttribute("data-contrast", contrast);
    try {
      localStorage.setItem("a11y:font", fontScale);
      localStorage.setItem("a11y:contrast", contrast);
    } catch {
      /* noop */
    }
  }, [fontScale, contrast]);

  const value = useMemo<A11yState>(
    () => ({
      fontScale,
      contrast,
      setFontScale: setFontScaleState,
      setContrast: setContrastState,
      cycleFontScale: () => {
        setFontScaleState((s) =>
          s === "normal" ? "large" : s === "large" ? "xlarge" : "normal",
        );
      },
      toggleContrast: () => setContrastState((c) => (c === "normal" ? "high" : "normal")),
    }),
    [fontScale, contrast],
  );

  return <A11yContext.Provider value={value}>{children}</A11yContext.Provider>;
}

export function useA11y() {
  const ctx = useContext(A11yContext);
  if (!ctx) throw new Error("useA11y must be used within A11yProvider");
  return ctx;
}

export { FONT_SCALE_LABEL };
