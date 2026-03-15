"use client";

import { UserMonthlyTrend } from "@/types/dashboard";
import {
  Line,
  LineChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { ChartContainer } from "../ui/chart";

const chartConfig = {
  assigned: {
    label: "Assigned",
    color: "var(--color-chart-1)",
  },
};

export const UserMonthlyTrendChart = ({
  dashboardData,
}: {
  dashboardData: UserMonthlyTrend[];
}) => {
  return (
    <Card className="flex flex-col rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all duration-200">
      <CardHeader className="items-center pb-0">
        <CardTitle>Monthly Trend</CardTitle>
        <CardDescription>Assignment trends over time</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="max-h-64 w-9/10">
          <LineChart
            data={dashboardData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ borderRadius: "8px", fontSize: "14px" }}
              cursor={{ strokeDasharray: "3 3" }}
            />
            <Legend 
              verticalAlign="bottom" 
              wrapperStyle={{ fontSize: 12 }}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="assigned"
              stroke={chartConfig.assigned.color}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
