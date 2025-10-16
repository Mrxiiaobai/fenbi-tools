import * as React from "react";
import { Spin, Menu, Modal, message, Select } from "antd";
import { TCacheData, TSetting } from "../types";
import { QuestionCount } from "../components/question-count";
import { HistoryCard } from "../components/history-card";
import { useNavigate } from "react-router-dom";
import { useSetting } from "../components/hooks";
import { categoryOptions } from "../utils/constant";
import { getVscodeApi } from "../utils/vscodeApi";

const vscode = getVscodeApi();

export const Home = () => {
  const [modal, contextHolder] = Modal.useModal();
  const [messageApi, messageHoder] = message.useMessage();
  const [historyList, setHistoryList] = React.useState<any>([]);
  const [loading, setLoading] = React.useState(true);

  const [treeData, setTreeData] = React.useState([]);
  const [cacheData, setCacheData] = React.useState<TCacheData>();
  // const [setting, setSetting] = React.useState<TSetting>({} as TSetting);
  const { setting, setSetting } = useSetting();

  const navigate = useNavigate();

  React.useEffect(() => {
    pageInit({ categoryId: setting.categoryId });
    getHistory({ count: 10, categoryId: 4 });
    window.addEventListener("message", (event: any) => {
      const message = event.data;
      setLoading(false);

      if (message.command === "setting") setTheme(message.data);
      if (message.command === "init") {
        setTreeData(message.data);
      }
      if (message.command === "pageCache") setCacheData(message.data);
      if (message.command === "message") {
        pageInit({ categoryId: setting.categoryId });
        messageApi.info(message.data.message);
      }
      if (message.command === "history") {
        setHistoryList(message.data);
      }
    });
  }, []);

  const setTheme = (theme: TSetting) => {
    setSetting((prev: any) => ({ ...prev, ...theme }));

    document.documentElement.style.setProperty(
      "--primary-color",
      theme.color || "#ffffff"
    );
    document.documentElement.style.setProperty(
      "--primary-backgroundColor",
      theme.backgroundColor || "#ffffff"
    );
  };

  const pageInit = (postData?: any) => {
    vscode.postMessage({
      command: "pageInit",
      postData,
    });
  };

  const menuClick = ({ key }: any) => {
    setLoading(true);

    let exerciseId: number | null = null;
    if (cacheData?.keypointIds?.includes(Number(key))) {
      exerciseId = cacheData?.exerciseId;
    }
    goDetail({ id: Number(key), exerciseId: Number(exerciseId) });
  };

  const onQuestionCountChange = (e: number) => {
    setLoading(true);
    vscode.postMessage({
      command: "changeQuestionCount",
      postData: {
        questionCount: e,
      },
    });
  };

  const goHistory = () => {
    navigate("/history", {
      state: {
        count: 15,
        categoryId: 3,
      },
    });
  };

  const goDetail = ({ id, exerciseId }: { id: number; exerciseId: number }) => {
    navigate("/detail", {
      state: {
        id,
        exerciseId,
      },
    });
  };

  const getHistory = ({
    count,
    categoryId,
    category,
  }: {
    category?: string;
    count?: number;
    categoryId?: number;
  }) => {
    vscode.postMessage({
      command: "history",
      postData: {
        category: category || setting.categoryId,
        count,
        categoryId,
      },
    });
  };

  const onChangeCategory = (e: string) => {
    pageInit({
      categoryId: e,
    });
    getHistory({ count: 10, categoryId: 4, category: e });
    setSetting((prev: any) => ({ ...prev, categoryId: e }));
  };

  return (
    <div>
      <Spin tip="loading..." spinning={loading}>
        <div>
          <Select
            options={categoryOptions}
            value={setting.categoryId || "xingce"}
            style={{ width: 120, margin: "10px" }}
            onChange={onChangeCategory}
          />
          {setting.categoryId == "shenlun" && (
            <div>
              ps：申论功能需要前往粉笔官网充vip才能交卷，与该插件无关，由于没有vip，交卷及后续功能暂无法支持，感谢理解！
            </div>
          )}
          <div className="menu-container">
            <HistoryCard
              onClick={goHistory}
              data={historyList}
              goExercise={(data) => {
                goDetail({
                  id: data?.[0]?.id,
                  exerciseId: data?.[0]?.id,
                });
              }}
            />
            <QuestionCount onChange={onQuestionCountChange} />
            <Menu
              theme="dark"
              onClick={menuClick}
              style={{ width: 256 }}
              mode="inline"
              items={treeData}
            />
          </div>
        </div>
      </Spin>

      {contextHolder}
    </div>
  );
};
