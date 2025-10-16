import * as React from "react";
import { Button, Spin, Modal, message } from "antd";
import { HistoryItem } from "../components/history-item";
import { useLocation, useNavigate } from "react-router-dom";
import { useSetting } from "../components/hooks";
import { getVscodeApi } from "../utils/vscodeApi";

declare const acquireVsCodeApi: any;

const vscode = getVscodeApi();

export const History = () => {
  const [modal, contextHolder] = Modal.useModal();
  const [messageApi, messageHoder] = message.useMessage();
  const [historyList, setHistoryList] = React.useState<any>([]);

  const [loading, setLoading] = React.useState(true);

  const { setting, setSetting } = useSetting();

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
    window.addEventListener("message", (event: any) => {
      const message = event.data;
      setLoading(false);

      if (message.command === "message") {
        // pageInit();
        messageApi.info(message.data.message);
      }

      if (message.command === "history") {
        setHistoryList(message.data);
      }
    });
  }, []);

  const goDetail = ({ id, exerciseId }: { id: number; exerciseId: number }) => {
    navigate("/detail", {
      state: {
        id,
        exerciseId,
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
          {historyList.map((item: any, index: number) => {
            return (
              <HistoryItem
                key={index}
                data={item}
                goExercise={(data) => {
                  goDetail({
                    id: data?.id,
                    exerciseId: data?.id,
                  });
                }}
              />
            );
          })}
        </div>
      </Spin>

      {contextHolder}
    </div>
  );
};
