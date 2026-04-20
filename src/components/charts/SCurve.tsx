"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface SCurvePoint {
  /** ISO date or label */
  date: string;
  /** 0-100 */
  planned: number;
  /** 0-100；實際進度（來自工項加權自動計算）*/
  actual: number;
}

/**
 * S-Curve — 計畫 vs 實際累積進度。
 * 規格書 §11：100% 自動來自日常表單，不允許手動填百分比。
 * 紅色提示：偏差 > 10%
 */
export function SCurve({
  data,
  height = 320,
}: {
  data: SCurvePoint[];
  height?: number;
}) {
  const latest = data.at(-1);
  const variance = latest ? latest.actual - latest.planned : 0;
  const tone =
    variance < -10
      ? "danger"
      : variance < -5
        ? "warn"
        : "success";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3 text-base">
        <span className="font-semibold text-ink">最新偏差：</span>
        <span
          className={
            tone === "danger"
              ? "font-bold text-danger-600"
              : tone === "warn"
                ? "font-bold text-warn-600"
                : "font-bold text-success-700"
          }
        >
          {variance >= 0 ? "+" : ""}
          {variance.toFixed(1)}%
        </span>
      </div>
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <ComposedChart
            data={data}
            margin={{ top: 12, right: 16, bottom: 8, left: 0 }}
          >
            <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#475569", fontSize: 14 }}
              stroke="#cbd5e1"
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fill: "#475569", fontSize: 14 }}
              stroke="#cbd5e1"
            />
            <Tooltip
              formatter={(val: number, name) => [`${val.toFixed(1)}%`, name]}
              contentStyle={{
                borderRadius: 12,
                border: "2px solid #e2e8f0",
                fontSize: 14,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 14 }} />
            <Area
              type="monotone"
              dataKey="planned"
              name="計畫進度"
              stroke="#94a3b8"
              fill="#cbd5e1"
              fillOpacity={0.35}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="actual"
              name="實際進度"
              stroke="#1d4ed8"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
