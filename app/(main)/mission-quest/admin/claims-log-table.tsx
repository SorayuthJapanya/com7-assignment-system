type Claim = {
  id: string;
  userId: string;
  nickname: string;
  username: string;
  missionId: string;
  points: number;
  month: number;
  year: number;
  claimedAt: string;
};

type Props = {
  claims: Claim[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  onSelectUser: (userId: string) => void;
  onRefresh: () => void;
};

export default function ClaimsLogTable({ claims, onSelectUser }: Props) {
  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h2 className="font-semibold text-sm">Claims Log</h2>
        <span className="text-xs text-slate-400">{claims.length} รายการล่าสุด</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-4 py-2.5">เวลา</th>
              <th className="px-4 py-2.5">Staff</th>
              <th className="px-4 py-2.5">Mission</th>
              <th className="px-4 py-2.5">แต้ม</th>
              <th className="px-4 py-2.5">เดือน</th>
            </tr>
          </thead>
          <tbody>
            {claims.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  ยังไม่มีข้อมูล Claim
                </td>
              </tr>
            ) : (
              claims.map((c) => (
                <tr key={c.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                    {new Date(c.claimedAt).toLocaleString("th-TH")}
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => onSelectUser(c.userId)}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {c.nickname}
                    </button>
                    <span className="text-xs text-slate-400 ml-1">@{c.username}</span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs">{c.missionId}</td>
                  <td className="px-4 py-2.5 font-semibold text-emerald-600">
                    +{c.points.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">
                    {c.month}/{c.year}
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