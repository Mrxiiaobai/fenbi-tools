import * as React from "react";
import { Alert, Button, Empty, Pagination, Spin, Tabs, Tooltip } from "antd";
import { ArrowLeftOutlined, ReloadOutlined, TrophyOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { LeaderboardPayload, LeaderboardSort } from "../../shared/types";
import { useVscodeMessage } from "../hooks/useVscodeMessage";
import { getVscodeApi } from "../utils/vscodeApi";
import "../style/leaderboard.less";

const vscode = getVscodeApi();
const rate = (value: number) => `${(value * 100).toFixed(1)}%`;

export const Leaderboard = () => {
  const navigate = useNavigate();
  const [sort, setSort] = React.useState<LeaderboardSort>("quantity");
  const [page, setPage] = React.useState(1);
  const [data, setData] = React.useState<LeaderboardPayload>();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const requestRef = React.useRef("");
  const sequenceRef = React.useRef(0);
  const tableScrollRef = React.useRef<HTMLDivElement>(null);

  const load = React.useCallback(() => {
    const requestId = `${Date.now()}-${++sequenceRef.current}`;
    requestRef.current = requestId;
    setLoading(true);
    setError("");
    setData(undefined);
    if (tableScrollRef.current) tableScrollRef.current.scrollTop = 0;
    vscode.postMessage({ command: "getLeaderboard", postData: { sort, page, requestId } });
  }, [sort, page]);

  useVscodeMessage((message) => {
    if (message.command === "leaderboard") {
      const incoming = message.data as LeaderboardPayload & { requestId: string };
      if (incoming.requestId !== requestRef.current) return;
      setData(incoming);
      setLoading(false);
    }
    if (message.command === "leaderboardError") {
      const incoming = message.data as { message: string; requestId: string };
      if (incoming.requestId !== requestRef.current) return;
      setError(incoming.message);
      setLoading(false);
    }
  });

  React.useEffect(load, [load]);

  React.useEffect(() => {
    if (!data) return;
    const nextDay = Date.parse(`${data.date}T00:00:00+08:00`) + 24 * 60 * 60 * 1000;
    const remaining = Math.max(1000, nextDay - Date.parse(data.updatedAt) + 1000);
    const timer = window.setTimeout(() => {
      if (page === 1) load();
      else setPage(1);
    }, remaining);
    return () => window.clearTimeout(timer);
  }, [data, load, page]);

  return (
    <div className="leaderboard-page">
      <header className="leaderboard-header">
        <Tooltip title="返回上一页">
          <Button type="text" aria-label="返回上一页" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} />
        </Tooltip>
        <h2><TrophyOutlined /> 今日排行榜</h2>
        <Tooltip title="刷新排行榜">
          <Button aria-label="刷新排行榜" icon={<ReloadOutlined />} disabled={loading} onClick={load} />
        </Tooltip>
      </header>
      <div className="leaderboard-date">{data ? `${data.date} · 北京时间` : "今日 · 北京时间"}</div>
      <Tabs activeKey={sort} items={[
        { key: "quantity", label: "答题量榜" },
        { key: "winRate", label: "胜率榜" },
      ]} onChange={(key) => { setSort(key as LeaderboardSort); setPage(1); }} />
      {error && <Alert type="error" showIcon message={error} action={<Button size="small" onClick={load}>重试</Button>} />}
      <Spin spinning={loading}>
        <div className="leaderboard-content" aria-busy={loading}>
          {data?.me && (
            <div className="leaderboard-own">
              <span>我 · {data.me.nickname}</span>
              <span>{data.me.rank === null ? "未上榜" : `第 ${data.me.rank} 名`}</span>
              <span>{data.me.questionCount} 题</span>
              <span>{rate(data.me.winRate)}</span>
            </div>
          )}
          <div className="leaderboard-table-scroll" ref={tableScrollRef} tabIndex={0} role="region" aria-label="排行榜列表">
            <table className="leaderboard-table">
              <colgroup><col className="rank-column" /><col /><col className="count-column" /><col className="rate-column" /></colgroup>
              <thead><tr><th scope="col">排名</th><th scope="col">用户昵称</th><th scope="col">答题量</th><th scope="col">胜率</th></tr></thead>
              <tbody>
                {data?.entries.map((entry) => (
                  <tr key={entry.userId} className={entry.userId === data.me?.userId ? "is-current-user" : ""}>
                    <td>{entry.rank}</td><td>{entry.nickname}</td><td>{entry.questionCount}</td><td>{rate(entry.winRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && !error && !data?.entries.length && <Empty description="今日暂无上榜用户" />}
          </div>
        </div>
      </Spin>
      {data && data.total > data.pageSize && (
        <footer className="leaderboard-footer">
          <Pagination size="small" current={data.page} pageSize={data.pageSize} total={data.total}
            showSizeChanger={false} onChange={setPage} />
        </footer>
      )}
    </div>
  );
};
