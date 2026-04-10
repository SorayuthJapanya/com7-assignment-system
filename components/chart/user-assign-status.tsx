"use client";

import { UserAssignmentStatus } from "@/types/dashboard";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const chartConfig = {
  approved: {
    label: "Approved",
    color: "var(--primary)", // Green
  },
  rejected: {
    label: "Rejected", 
    color: "var(--destructive)", // Red
  },
  pending: {
    label: "Pending",
    color: "#f59e0b", // Orange
  },
};

export const UserAssignmentStatusChart = ({
  dashboardData,
}: {
  dashboardData: UserAssignmentStatus[];
}) => {
  // Transform data for stacked bar chart
  const transformedData = dashboardData.map((user) => ({
    username: user.nickname || user.username,
    approved: user.approved,
    rejected: user.rejected,
    pending: user.pending,
  }));

  return (
    <Card className="w-full flex flex-col rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all duration-200">
      <CardHeader className="items-center pb-0">
        <CardTitle>User Assignment Status</CardTitle>
        <CardDescription>Number of assignments per user</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="max-h-64 w-full">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={transformedData}
              margin={{ top: 20, right: 30, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="username" 
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
              <Legend 
                content={<ChartLegendContent />}
                verticalAlign="bottom"
                height={36}
              />
              <Bar
                dataKey="pending"
                stackId="a"
                fill={chartConfig.pending.color}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="rejected"
                stackId="a"
                fill={chartConfig.rejected.color}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="approved"
                stackId="a"
                fill={chartConfig.approved.color}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
