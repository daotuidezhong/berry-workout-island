import { requireChatGPTUser } from "../chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  const [{ env }, { listAllCheckins }] = await Promise.all([import("cloudflare:workers"), import("../../db/checkins")]);
  const ownerEmail = (env as unknown as { OWNER_EMAIL?: string }).OWNER_EMAIL;
  if (!ownerEmail || user.email.toLowerCase() !== ownerEmail.toLowerCase()) {
    return <main className="backup-admin"><h1>无权查看备份</h1><a href="/">返回游戏</a></main>;
  }

  const records = await listAllCheckins();
  return (
    <main className="backup-admin">
      <header><div><small>OWNER BACKUP</small><h1>下载者记录备份</h1><p>共 {records.length} 条记录，仅屋主账号可见。</p></div><a href="/">返回游戏</a></header>
      <div className="backup-table-wrap">
        <table>
          <thead><tr><th>设备</th><th>日期</th><th>运动</th><th>时长</th><th>卡路里</th><th>心情</th></tr></thead>
          <tbody>{records.map((record) => <tr key={record.id}><td>{record.deviceId.slice(0, 8)}</td><td>{record.date}</td><td>{record.activity}</td><td>{record.minutes ? `${record.minutes} 分钟` : "—"}</td><td>{record.calories == null ? "—" : `${record.calories} kcal`}</td><td>{record.mood || "—"}</td></tr>)}</tbody>
        </table>
        {!records.length && <p className="backup-empty">还没有收到下载者的记录。</p>}
      </div>
    </main>
  );
}
