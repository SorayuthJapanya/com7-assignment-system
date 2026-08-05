type KpiScope = {
  key:
    | "claimsToday"
    | "pointsToday"
    | "claimsThisMonth"
    | "activeStaff"
    | "topMission"
    | "overdueCountToday"
    | "overduePointsToday"
    | "overduePointsThisMonth"
    | "overdueMinutesThisMonth";
  title: string;
  kind: "claim" | "overdue";
};

type Props = {
  kpi: {
    claimsToday: number;
    pointsToday: number;
    claimsThisMonth: number;
    activeStaff: number;
    topMission: { missionId: string; count: number } | null;
    overduePointsToday: number;
    overdueCountToday: number;
    overduePointsThisMonth: number;
    overdueCountThisMonth: number;
    overdueMinutesThisMonth: number;
  };
  onSelect?: (scope: KpiScope) => void;
};

const cardBtn =
  "rounded-xl p-4 text-left w-full transition hover:ring-2 hover:ring-offset-1 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-default disabled:hover:ring-0";

export default function AdminKpiCards({ kpi, onSelect }: Props) {
  return (
    <div className="space-y-3">
      {/* แถว Claim */}
      <div>
        <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
          ได้แต้มจาก Claim
        </p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <button
            type="button"
            onClick={() =>
              onSelect?.({ key: "claimsToday", title: "Claims วันนี้", kind: "claim" })
            }
            className={`${cardBtn} bg-blue-50 text-blue-700 hover:ring-blue-300 focus:ring-blue-300`}
          >
            <p className="text-xs font-medium opacity-70">Claims วันนี้</p>
            <p className="text-lg font-bold mt-1">{kpi.claimsToday}</p>
          </button>

          <button
            type="button"
            onClick={() =>
              onSelect?.({ key: "pointsToday", title: "แต้มจ่ายวันนี้", kind: "claim" })
            }
            className={`${cardBtn} bg-emerald-50 text-emerald-700 hover:ring-emerald-300 focus:ring-emerald-300`}
          >
            <p className="text-xs font-medium opacity-70">แต้มจ่ายวันนี้</p>
            <p className="text-lg font-bold mt-1">+{kpi.pointsToday.toLocaleString()}</p>
          </button>

          <button
            type="button"
            onClick={() =>
              onSelect?.({ key: "claimsThisMonth", title: "Claims เดือนนี้", kind: "claim" })
            }
            className={`${cardBtn} bg-violet-50 text-violet-700 hover:ring-violet-300 focus:ring-violet-300`}
          >
            <p className="text-xs font-medium opacity-70">Claims เดือนนี้</p>
            <p className="text-lg font-bold mt-1">{kpi.claimsThisMonth}</p>
          </button>

          <button
            type="button"
            onClick={() =>
              onSelect?.({ key: "activeStaff", title: "Staff Active", kind: "claim" })
            }
            className={`${cardBtn} bg-amber-50 text-amber-700 hover:ring-amber-300 focus:ring-amber-300`}
          >
            <p className="text-xs font-medium opacity-70">Staff Active</p>
            <p className="text-lg font-bold mt-1">{kpi.activeStaff}</p>
          </button>

          <div className="rounded-xl p-4 bg-slate-50 text-slate-700">
            <p className="text-xs font-medium opacity-70">Mission ยอดนิยม</p>
            <p className="text-lg font-bold mt-1">
              {kpi.topMission
                ? `${kpi.topMission.missionId} (${kpi.topMission.count})`
                : "-"}
            </p>
          </div>
        </div>
      </div>

      {/* แถว Overdue */}
      <div>
        <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
          ใช้แต้มกับ Overdue
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() =>
              onSelect?.({
                key: "overdueCountToday",
                title: "ครั้งที่ Redeem วันนี้",
                kind: "overdue",
              })
            }
            className={`${cardBtn} bg-red-50 text-red-700 hover:ring-red-300 focus:ring-red-300`}
          >
            <p className="text-xs font-medium opacity-70">ครั้งที่ Redeem วันนี้</p>
            <p className="text-lg font-bold mt-1">{kpi.overdueCountToday}</p>
          </button>

          <button
            type="button"
            onClick={() =>
              onSelect?.({
                key: "overduePointsToday",
                title: "แต้มใช้วันนี้",
                kind: "overdue",
              })
            }
            className={`${cardBtn} bg-red-50 text-red-700 hover:ring-red-300 focus:ring-red-300`}
          >
            <p className="text-xs font-medium opacity-70">แต้มใช้วันนี้</p>
            <p className="text-lg font-bold mt-1">-{kpi.overduePointsToday.toLocaleString()}</p>
          </button>

          <button
            type="button"
            onClick={() =>
              onSelect?.({
                key: "overduePointsThisMonth",
                title: "แต้มใช้เดือนนี้",
                kind: "overdue",
              })
            }
            className={`${cardBtn} bg-orange-50 text-orange-700 hover:ring-orange-300 focus:ring-orange-300`}
          >
            <p className="text-xs font-medium opacity-70">แต้มใช้เดือนนี้</p>
            <p className="text-lg font-bold mt-1">
              -{kpi.overduePointsThisMonth.toLocaleString()}
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              onSelect?.({
                key: "overdueMinutesThisMonth",
                title: "นาทีที่ลดเดือนนี้",
                kind: "overdue",
              })
            }
            className={`${cardBtn} bg-orange-50 text-orange-700 hover:ring-orange-300 focus:ring-orange-300`}
          >
            <p className="text-xs font-medium opacity-70">นาทีที่ลดเดือนนี้</p>
            <p className="text-lg font-bold mt-1">
              {kpi.overdueMinutesThisMonth.toLocaleString()} นาที
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}

export type { KpiScope };