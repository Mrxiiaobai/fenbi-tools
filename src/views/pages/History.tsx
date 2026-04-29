import * as React from "react";
import { Button, Spin, message } from "antd";
import { HistoryItem } from "../components/history-item";
import { useLocation, useNavigate } from "react-router-dom";
import { useSetting } from "../components/hooks";
import { getVscodeApi } from "../utils/vscodeApi";
import { HistoryExercise } from "../types";
import { useVscodeMessage } from "../hooks/useVscodeMessage";

const vscode = getVscodeApi();

export const History = () => {
  const [messageApi, messageHolder] = message.useMessage();
  const [historyList, setHistoryList] = React.useState<HistoryExercise[]>([]);

  const [loading, setLoading] = React.useState(true);

  const { setting } = useSetting();

  const navigate = useNavigate();
  const location = useLocation();
  const { count, categoryId } = location.state || {};

  React.useEffect(() => {
    vscode.postMessage({
      command: "history",
      postData: {
        category: setting.categoryId,
        count: count,
        categoryId: categoryId,
      },
    });
  }, []);

  useVscodeMessage((message) => {
    setLoading(false);

    if (message.command === "message") {
      messageApi.info((message.data as { message?: string })?.message || "");
    }

    if (message.command === "history") {
      setHistoryList((message.data as HistoryExercise[]) || []);
    }
  });

  const goDetail = ({
    id,
    combineKey,
  }: {
    id?: number;
    combineKey?: string;
  }) => {
    navigate("/detail", {
      state: {
        id,
        combineKey,
      },
    });
  };

  const onBack = () => {
    navigate(-1);
  };

  return (
    <div>
      <Spin tip="loading..." spinning={loading}>
        <div className="menu-container">
          <Button type="text" onClick={onBack}>
            返回上一页
          </Button>
          {historyList.map((item, index) => {
            return (
              <HistoryItem
                key={index}
                data={item}
                goExercise={(data) => {
                  goDetail({
                    combineKey: data?.key,
                    // exerciseId: data?.id,
                  });
                }}
              />
            );
          })}
        </div>
      </Spin>

      {messageHolder}
    </div>
  );
};
