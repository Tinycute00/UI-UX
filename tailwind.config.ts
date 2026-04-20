import type { Config } from "tailwindcss";

/**
 * Tailwind config tuned for 50-70 歲友善設計：
 *  - 正文最小 18px（base = 18px）
 *  - 高對比深藍/深綠 + 極淺底
 *  - 按鈕高度 token（56/60/64）
 *  - 手機優先斷點
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  darkMode: ["class"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
    },
    extend: {
      colors: {
        // 主色：工程深藍（高可讀性、高對比）
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#2563eb",
          600: "#1d4ed8",
          700: "#1e40af",
          800: "#1e3a8a",
          900: "#172554",
        },
        // 輔助：工地安全綠
        success: {
          50: "#f0fdf4",
          500: "#16a34a",
          600: "#15803d",
          700: "#166534",
        },
        // 警示：偏差>10% 紅
        danger: {
          50: "#fef2f2",
          500: "#dc2626",
          600: "#b91c1c",
          700: "#991b1b",
        },
        // 資訊：黃（提醒）
        warn: {
          50: "#fffbeb",
          500: "#d97706",
          600: "#b45309",
        },
        surface: {
          DEFAULT: "#ffffff",
          muted: "#f8fafc",
          subtle: "#f1f5f9",
          border: "#e2e8f0",
        },
        ink: {
          DEFAULT: "#0f172a",
          muted: "#334155",
          subtle: "#475569",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Noto Sans TC",
          "PingFang TC",
          "Microsoft JhengHei",
          "sans-serif",
        ],
      },
      fontSize: {
        // 專為 50-70 歲放大
        base: ["18px", { lineHeight: "1.7" }],
        lg: ["20px", { lineHeight: "1.7" }],
        xl: ["22px", { lineHeight: "1.6" }],
        "2xl": ["26px", { lineHeight: "1.4" }],
        "3xl": ["30px", { lineHeight: "1.35" }],
        "4xl": ["36px", { lineHeight: "1.3" }],
      },
      spacing: {
        touch: "60px", // 最小觸控區
        "touch-lg": "64px",
        "btn-desktop": "56px",
        "btn-mobile": "60px",
      },
      borderRadius: {
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(15 23 42 / 0.08), 0 1px 2px -1px rgb(15 23 42 / 0.06)",
        "card-hover":
          "0 4px 12px -2px rgb(15 23 42 / 0.12), 0 2px 6px -2px rgb(15 23 42 / 0.08)",
        focus: "0 0 0 4px rgb(37 99 235 / 0.35)",
      },
      screens: {
        xs: "390px",
      },
    },
  },
  plugins: [],
};

export default config;
