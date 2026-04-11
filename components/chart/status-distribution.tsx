"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { StatusDistribution } from "@/types/dashboard";

interface StatusDistributionChartProps {
  data: StatusDistribution[];
}

const STATUS_COLORS: Record<string, string> = {
  Pending: "#facc15",
  Approved: "#22c55e",
  Rejected: "#ef4444",
  "Not Submit": "#9ca3af",
};

const DEFAULT_COLOR = "#193cb8";

interface CustomTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; payload: StatusDistribution }[];
  total: number;
}

function CustomTooltip({ active, payload, total }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  const color = STATUS_COLORS[entry.name] ?? DEFAULT_COLOR;
  const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0.0";

  return (
    <div className="rounded-xl border bg-card shadow-lg p-2 text-xs min-w-20 z-50">
      <div className="flex items-center gap-2 mb-2">
        <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="font-semibold text-foreground">{entry.name}</span>
      </div>
      <div className="flex justify-between gap-4 text-muted-foreground">
        <span>Count</span>
        <span className="font-medium text-foreground tabular-nums">{entry.value}</span>
      </div>
      <div className="flex justify-between gap-4 text-muted-foreground">
        <span>Share</span>
        <span className="font-medium tabular-nums" style={{ color }}>{pct}%</span>
      </div>
    </div>
  );
}

export const StatusDistributionChart = ({
  data,
}: StatusDistributionChartProps) => {
  const total = (data || []).reduce((sum, d) => sum + d.value, 0);

  const formatTotal = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

  return (
    <Card className="flex flex-col rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all duration-200">
      <CardHeader className="items-center pb-0">
        <CardTitle>Assignment Status</CardTitle>
        <CardDescription>Distribution of current statuses</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        {/* Donut with center label */}
        <div className="relative">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Tooltip content={<CustomTooltip total={total} />} />
              <Pie
                data={data || []}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                cornerRadius={8}
                dataKey="value"
                stroke="var(--color-background)"
              >
                {(data || []).map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={STATUS_COLORS[entry.name] ?? DEFAULT_COLOR}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Center label */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center z-0">
            <span className="text-2xl font-bold tabular-nums leading-tightz-0">
              {formatTotal(total)}
            </span>
            <span className="text-xs text-muted-foreground mt-0.5">Total</span>
          </div>
        </div>

        {/* Custom legend — flex wrap */}
        <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2 px-2">
          {(data || []).map((entry, index) => {
            const color = STATUS_COLORS[entry.name] ?? DEFAULT_COLOR;
            const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0.0";
            return (
              <div key={index} className="flex items-center gap-1.5 text-xs">
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-foreground">{entry.name}</span>
                <span className="text-muted-foreground tabular-nums text-xs">
                  {entry.value} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
