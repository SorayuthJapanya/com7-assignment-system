type OverdueRow = {
  id: string;
  userId: string;
  nickname: string;
  username: string;
  points: number;
  pointsUsed: number;
  minutes: number;
  createdAt: string;
};

type Props = {
  rows: OverdueRow[];
  onSelectUser: (userId: string) => void;
};

export default function OverdueLogTable({ rows, onSelectUser }: Props) {
  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h2 className="font-semibold text-sm">Overdue Redeem Log</h2>
        <span className="text-xs text-slate-400">{rows.length} รายการล่าสุด</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-4 py-2.5">เวลา</th>
              <th className="px-4 py-2.5">Staff</th>
              <th className="px-4 py-2.5">ใช้แต้ม</th>
              <th className="px-4 py-2.5">ลดเวลา</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  ยังไม่มีประวัติ Redeem Overdue
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleString("th-TH")}
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => onSelectUser(r.userId)}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {r.nickname}
                    </button>
                    <span className="text-xs text-slate-400 ml-1">@{r.username}</span>
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-red-600 tabular-nums">
                    -{r.pointsUsed.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-600">
                    {r.minutes.toLocaleString()} นาที
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}