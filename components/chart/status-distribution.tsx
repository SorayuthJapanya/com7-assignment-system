"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { StatusDistribution, ChartColors } from "@/types/dashboard";

interface StatusDistributionChartProps {
  data: StatusDistribution[];
  colors?: ChartColors | string[];
}

const defaultColors = [
  "#193cb8",
  "var(--color-primary)",
  "var(--color-destructive)",
  "#facc15", // yellow
  "#9ca3af", // gray
];

export const StatusDistributionChart = ({
  data,
  colors,
}: StatusDistributionChartProps) => {
  const colorArray = defaultColors;

  return (
    <Card className="flex flex-col rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all duration-200">
      <CardHeader className="items-center pb-0">
        <CardTitle>Assignment Status</CardTitle>
        <CardDescription>Distribution of current statuses</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Tooltip
              contentStyle={{ borderRadius: "8px", fontSize: "14px" }}
              cursor={{ fill: "transparent" }}
            />
            <Pie
              data={data || []}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={2}
              stroke="var(--color-background)"
              isAnimationActive={false}
            >
              {(data || []).map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colorArray[index % colorArray.length]}
                />
              ))}
            </Pie>
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: "13px", paddingTop: "10px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
