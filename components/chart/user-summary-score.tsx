"use client";

import { UserScoreSummary } from "@/types/dashboard";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer } from "../ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

interface UserSummaryScoreChartProps {
  dashboardData: UserScoreSummary[];
}

const chartConfig = {
  totalScore: {
    label: "Total Score",
    color: "var(--color-chart-3)",
  },
};

export const UserSummaryScoreChart = ({
  dashboardData,
}: UserSummaryScoreChartProps) => {
  return (
    <Card className="flex flex-col rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all duration-200">
      <CardHeader className="items-center pb-0">
        <CardTitle>User Score Summary</CardTitle>
        <CardDescription>Total scores and assignment counts per user</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="max-h-64 w-9/10">
          <BarChart
            data={dashboardData}
            style={{ margin: "0", padding: "0" }}
          >
            <CartesianGrid vertical={false} />
            <XAxis dataKey="username" tick={{ fontSize: 12 }} angle={-45} />
            <YAxis />
            <Tooltip />
            <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 12 }} />
            <Bar
              dataKey="totalScore"
              fill={chartConfig.totalScore.color}
              isAnimationActive={false}
              radius={[10, 10, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
