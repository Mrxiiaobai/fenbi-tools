import * as React from "react";
import { Spin, Menu, Modal, message, Select, Button, Flex } from "antd";
import { TCacheData, TSetting } from "../types";
import { QuestionCount } from "../components/question-count";
import { HistoryCard } from "../components/history-card";
import { useNavigate } from "react-router-dom";
import { useSetting } from "../components/hooks";
import { categoryOptions } from "../utils/constant";
import { getVscodeApi } from "../utils/vscodeApi";
import { modifyArray } from "../utils/modifyArray";

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
    getHistory({ count: 15, categoryId: 4 });
    window.addEventListener("message", (event: any) => {
      const message = event.data;
      setLoading(false);

      if (message.command === "setting") setTheme(message.data);
      if (message.command === "init") {
        const menu = message.data.menu;
        const cacheResult = message.data.cacheResult;
        setTreeData(modifyArray(menu, cacheResult?.keypointIds || []));
      }
      if (message.command === "pageCache") setCacheData(message.data);
      if (message.command === "message") {
        pageInit({ categoryId: setting.categoryId });
        messageApi.info(message.data.message);
      }
      if (message.command === "history") {
        console.log("🚀 ~ Home ~ message.data:", message.data);
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

    let combineKey: string | null = null;
    const len = cacheData?.keypointIds?.length || 0;
    if (cacheData?.keypointIds[len - 1] == key) {
      combineKey = cacheData?.combineKey || "";
    }
    // if (cacheData?.keypointIds?.includes(Number(key))) {
    //   exerciseId = cacheData?.exerciseId;
    // }
    goDetail({ id: Number(key), combineKey: combineKey || "" });
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
    getHistory({ count: 15, categoryId: 4, category: e });
    setSetting((prev: any) => ({ ...prev, categoryId: e }));
  };

  return (
    <div>
      <Spin tip="loading..." spinning={loading}>
        <div>
          <Flex justify="flex-end" align="center">
            <Button
              type="link"
              size="small"
              style={{ borderColor: "white" }}
              onClick={() => {
                vscode.postMessage({
                  command: "openInBrowser",
                  postData: {
                    url: "https://github.com/Mrxiiaobai/fenbi-tools/issues",
                  },
                });
              }}
            >
              问题反馈
            </Button>
            <Button
              type="link"
              size="small"
              style={{ borderColor: "white" }}
              onClick={() => {
                console.log("1111222");
                vscode.postMessage({
                  command: "openInBrowser",
                  postData: {
                    url: "https://github.com/Mrxiiaobai/fenbi-tools/issues/9",
                  },
                });
              }}
            >
              入群交流
            </Button>
          </Flex>
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
                  // id: data?.[0]?.id,
                  combineKey: data?.key,
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
