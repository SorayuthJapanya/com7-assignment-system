"use client";

import { MonthlyTrend } from "@/types/dashboard";
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
  total: {
    label: "Total",
    color: "var(--color-chart-1)",
  },
  submitted: {
    label: "Submitted",
    color: "var(--color-chart-2)",
  },
  approved: {
    label: "Approved",
    color: "var(--color-chart-3)",
  },
  rejected: {
    label: "Rejected",
    color: "var(--color-chart-5)",
  },
  lateSubmit: {
    label: "Late Submit",
    color: "var(--color-chart-4)",
  },
};

export const MonthlyTrendChart = ({
  dashboardData,
}: {
  dashboardData: MonthlyTrend[];
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
              dataKey="total"
              stroke={chartConfig.total.color}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="submitted"
              stroke={chartConfig.submitted.color}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="approved"
              stroke={chartConfig.approved.color}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="rejected"
              stroke={chartConfig.rejected.color}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="lateSubmit"
              stroke={chartConfig.lateSubmit.color}
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
