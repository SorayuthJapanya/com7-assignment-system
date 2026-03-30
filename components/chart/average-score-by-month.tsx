"use client";

import { AverageScoreByMonth } from "@/types/dashboard";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "../ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

// Helper function to format month to short name
const formatShortMonth = (monthStr: string) => {
  const date = new Date(monthStr + "-01");
  return date.toLocaleDateString('en-US', { month: 'short' });
};

const chartConfig = {
  averageScore: {
    label: "Average Score",
    color: "var(--chart-4)",
  },
};

interface AverageScoreChartProps {
  dashboardData: AverageScoreByMonth[];
}

export const AverageScoreByMonthChart = ({
  dashboardData,
}: AverageScoreChartProps) => {
  // Transform data with formatted month names
  const transformedData = dashboardData.map((item) => ({
    ...item,
    shortMonth: formatShortMonth(item.month),
  }));

  return (
    <Card className="flex flex-col rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all duration-200">
      <CardHeader className="items-center pb-0">
        <CardTitle>Average Score By Month</CardTitle>
        <CardDescription>Average assignment scores per month</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="max-h-64 w-full">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart
              data={transformedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="shortMonth" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                content={<ChartTooltipContent />}
                cursor={{ strokeDasharray: "3 3" }}
              />
              <Line
                type="monotone"
                dataKey="averageScore"
                stroke={chartConfig.averageScore.color}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
