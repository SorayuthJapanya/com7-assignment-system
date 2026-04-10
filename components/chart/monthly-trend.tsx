"use client";

import { MonthlyTrend } from "@/types/dashboard";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { ChartContainer, ChartTooltipContent } from "../ui/chart";

// Helper function to format month to short name
const formatShortMonth = (monthStr: string) => {
  const date = new Date(monthStr + "-01");
  return date.toLocaleDateString('en-US', { month: 'short' });
};

const chartConfig = {
  approved: {
    label: "Approved",
    color: "var(--primary)",
  },
};

export const MonthlyTrendChart = ({
  dashboardData,
}: {
  dashboardData: MonthlyTrend[];
}) => {
  // Transform data with formatted month names
  const transformedData = dashboardData.map((item) => ({
    ...item,
    shortMonth: formatShortMonth(item.month),
  }));

  return (
    <Card className="h-full flex flex-col rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all duration-200">
      <CardHeader className="items-center pb-0">
        <CardTitle>Tasks Completed By Month</CardTitle>
        <CardDescription>Approved assignments per month</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="max-h-74 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={transformedData}
              margin={{ top: 30, right: 30, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="shortMonth" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                content={<ChartTooltipContent />}
                cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
              />
              <Bar
                dataKey="approved"
                fill={chartConfig.approved.color}
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              >
                <LabelList 
                  dataKey="approved" 
                  position="top" 
                  style={{ fontSize: '12px', fill: '#666' }}
                />
                {transformedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartConfig.approved.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
