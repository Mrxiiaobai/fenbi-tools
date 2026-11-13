import * as React from "react";
import { Button, Tooltip } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { getObjectiveResultStats } from "../../shared/resultStats";
import { LeaderboardReportStatus, LeaderboardResult, SolutionPayload } from "../../shared/types";
import { useVscodeMessage } from "../hooks/useVscodeMessage";
import { getVscodeApi } from "../utils/vscodeApi";

const vscode = getVscodeApi();

export const LeaderboardResultStatus = ({ data }: { data?: SolutionPayload }) => {
  const [status, setStatus] = React.useState<LeaderboardReportStatus>();
  const resultRef = React.useRef<LeaderboardResult>();
  const submissionId = data?.leaderboardSubmissionId;

  const upload = React.useCallback(() => {
    if (!resultRef.current) return;
    setStatus({ submissionId: resultRef.current.submissionId, status: "uploading" });
    vscode.postMessage({ command: "reportLeaderboardResult", postData: resultRef.current });
  }, []);

  useVscodeMessage((message) => {
    if (message.command !== "leaderboardReport") return;
    const incoming = message.data as LeaderboardReportStatus;
    if (incoming.submissionId === submissionId) setStatus(incoming);
  });

  React.useEffect(() => {
    if (!submissionId || !data.leaderboardCompletedAt) return;
    const stats = getObjectiveResultStats(data.solutions);
    if (!stats.questionCount) return;
    resultRef.current = { submissionId, ...stats, completedAt: data.leaderboardCompletedAt };
    upload();
  }, [submissionId, upload]);

  if (!submissionId || !resultRef.current) return null;
  const result = resultRef.current;

  return (
    <div className="leaderboard-result" role="status">
      <span>本次答题 {result.questionCount} 题 · 胜率 {(result.correctCount / result.questionCount * 100).toFixed(1)}%</span>
      <span>{status?.status === "success" ? "成绩已记录" : status?.status === "error" ? "上报失败" : "成绩上报中…"}</span>
      {status?.status === "error" && (
        <Tooltip title={status.message}>
          <Button size="small" icon={<ReloadOutlined />} onClick={upload}>重试</Button>
        </Tooltip>
      )}
    </div>
  );
};
