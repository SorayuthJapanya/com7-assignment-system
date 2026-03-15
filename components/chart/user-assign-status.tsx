"use client";

import { UserAssignmentStatus } from "@/types/dashboard";
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

const chartConfig = {
  submitted: {
    label: "Submitted",
    color: "var(--color-chart-1)",
  },
  approved: {
    label: "Approved",
    color: "var(--color-chart-2)",
  },
  rejected: {
    label: "Rejected",
    color: "var(--color-chart-5)",
  },
  pending: {
    label: "Pending",
    color: "var(--color-chart-3)",
  },
};

export const UserAssignmentStatusChart = ({
  dashboardData,
}: {
  dashboardData: UserAssignmentStatus[];
}) => {
  return (
    <Card className="w-full flex flex-col rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all duration-200">
      <CardHeader className="items-center pb-0">
        <CardTitle>User Assignment Status</CardTitle>
        <CardDescription>Number of assignments per user</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="max-h-64 w-full">
          <BarChart
            accessibilityLayer
            data={dashboardData}
            style={{ margin: "0", padding: "0" }}
          >
            <CartesianGrid vertical={false} />
            <XAxis dataKey="username" tick={{ fontSize: 12 }} angle={-45} />
            <YAxis />
            <Tooltip />
            <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 12 }} />
            <Bar
              dataKey="submitted"
              fill="var(--color-chart-1)"
              radius={4}
              isAnimationActive={false}
            />
            <Bar
              dataKey="approved"
              fill="var(--color-chart-2)"
              radius={4}
              isAnimationActive={false}
            />
            <Bar
              dataKey="rejected"
              fill="var(--color-chart-3)"
              radius={4}
              isAnimationActive={false}
            />
            <Bar
              dataKey="pending"
              fill="var(--color-chart-4)"
              radius={4}
              isAnimationActive={false}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
