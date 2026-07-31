"use client";

import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Sector,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MissionCategoryChartPoint, MissionProgressChartPoint } from "@/types/mission-quest";

const PIE_COLORS = ["#5dcaa5", "#ed93b1", "#97c459", "#f0997b", "#afa9ec", "#fac775"];

interface MissionChartsProps {
  categoryChart: MissionCategoryChartPoint[];
  progressChart: MissionProgressChartPoint[];
}

function renderActiveShape(props: any) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 6}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
    />
  );
}

function renderOuterLabel(props: any, activeIndex: number | null) {
  const { cx, cy, midAngle, outerRadius, index, name, value } = props;
  const RAD = Math.PI / 180;
  const sin = Math.sin(-RAD * midAngle);
  const cos = Math.cos(-RAD * midAngle);
  const sx = cx + (outerRadius + 4) * cos;
  const sy = cy + (outerRadius + 4) * sin;
  const mx = cx + (outerRadius + 22) * cos;
  const my = cy + (outerRadius + 22) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 12;
  const ey = my;
  const textAnchor = cos >= 0 ? "start" : "end";
  const isActive = activeIndex === index;
  const isDimmed = activeIndex !== null && !isActive;

  const nameColor = isActive ? "#4338ca" : isDimmed ? "#cbd5e1" : "#0f172a";
  const subColor = isActive ? "#4338ca" : isDimmed ? "#e2e8f0" : "#94a3b8";
  const lineColor = isDimmed ? "#f1f5f9" : "#cbd5e1";

  return (
    <g>
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={lineColor} fill="none" />
      <text
        x={ex + (cos >= 0 ? 6 : -6)}
        y={ey - 6}
        textAnchor={textAnchor}
        fontSize={12}
        fontWeight={700}
        fill={nameColor}
      >
        {name}
      </text>
      <text
        x={ex + (cos >= 0 ? 6 : -6)}
        y={ey + 8}
        textAnchor={textAnchor}
        fontSize={11}
        fontWeight={isActive ? 700 : 400}
        fill={subColor}
      >
        {value} quests
      </text>
    </g>
  );
}

export default function MissionCharts({ categoryChart, progressChart }: MissionChartsProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold">Missions by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ height: 380 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 30, right: 60, bottom: 30, left: 60 }}>
                <Pie
                  data={categoryChart}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="42%"
                  outerRadius="55%"
                  paddingAngle={2}
                  activeIndex={activeIndex ?? undefined}
                  activeShape={renderActiveShape}
                  label={(props) => renderOuterLabel(props, activeIndex)}
                  labelLine={false}
                  // 1. ปิดแอนิเมชันของพายเพื่อให้เปลี่ยนสถานะทันทีตามเมาส์
                  isAnimationActive={false}
                  animationDuration={0}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {categoryChart.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                      stroke="#fff"
                      strokeWidth={2}
                      style={{
                        // 2. ใช้ CSS transition เพื่อให้เอฟเฟกต์หรี่สีสมูทขึ้นนิดหน่อย (ทางเลือก) หรือนำออกได้ถ้าต้องการให้ขาดทันที
                        transition: "opacity 0.1s ease",
                      }}
                      opacity={activeIndex === null || activeIndex === index ? 1 : 0.5}
                    />
                  ))}
                </Pie>
                <Tooltip
                  // 3. ปิดแอนิเมชันวิ่งตามของ Tooltip
                  isAnimationActive={false}
                  animationDuration={0}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div 
                        style={{ 
                          background: "#fff", 
                          border: "1px solid #e2e8f0", 
                          borderRadius: 8, 
                          padding: "8px 12px", 
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                          // ป้องกันปัญหา Tooltip บังเมาส์แล้วส่งผลให้ฟังก์ชันลูปหลุด Hover ออก
                          pointerEvents: "none" 
                        }}
                      >
                        <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{d.name}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                          Quests: {d.value}
                        </p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold">Progress by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressChart} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="category" width={70} tick={{ fontSize: 11, fill: "#4a4a68" }} axisLine={false} tickLine={false} />
                {/* เพิ่มการปิดแอนิเมชันให้กราฟแท่งด้านข้างด้วย เพื่อความลื่นไหลในภาพรวม */}
                <Tooltip isAnimationActive={false} animationDuration={0} formatter={(value: number) => [`${value}%`, "Progress"]} />
                <Bar isAnimationActive={false} dataKey="progressPct" fill="#0d9488" radius={[0, 5, 5, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}