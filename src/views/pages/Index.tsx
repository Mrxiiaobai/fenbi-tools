import * as React from "react";
import { Spin, Modal, message, Select, Button, Flex } from "antd";
import { TCacheData, TSetting } from "../types";
import { QuestionCount } from "../components/question-count";
import { CustomTree } from "../components/custom-tree";
import { HistoryCard } from "../components/history-card";
import { useNavigate } from "react-router-dom";
import { useSetting } from "../components/hooks";
import { categoryOptions } from "../utils/constant";
import { getVscodeApi } from "../utils/vscodeApi";
import { modifyArrayToTree } from "../utils/modifyArray";

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
        const _data = modifyArrayToTree(menu, cacheResult || {}, treeClick);
        setTreeData(_data as any);
      }
      if (message.command === "pageCache") {
        setCacheData(message.data);
      }
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
      theme.color || "#ffffff",
    );
    document.documentElement.style.setProperty(
      "--primary-backgroundColor",
      theme.backgroundColor || "#ffffff",
    );
    document.documentElement.style.setProperty(
      "--primary-fontSize",
      `${theme.fontSize || 12}px`,
    );
  };

  const pageInit = (postData?: any) => {
    vscode.postMessage({
      command: "pageInit",
      postData,
    });
  };

  const treeClick = (e: any, cacheResult: any) => {
    const key = e.id;

    setLoading(true);
    let combineKey: string | null = null;
    const len = cacheResult?.keypointIds?.length || 0;
    if (len > 0 && cacheResult?.keypointIds?.includes(key)) {
      combineKey = cacheResult?.combineKey || "";
    }
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
    type,
  }: {
    id?: number;
    combineKey?: string;
    type?: number;
  }) => {
    navigate("/detail", {
      state: {
        id,
        combineKey,
        type,
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
    vscode.postMessage({
      command: "changeCategory",
      postData: {
        categoryId: e,
      },
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
          <Flex justify="flex-start" align="center">
            <Button
              type="link"
              style={{ borderColor: "white" }}
              onClick={() => {
                goDetail({
                  type: 2,
                });
              }}
            >
              快速练习
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
                  type: 1,
                  combineKey: data?.key,
                });
              }}
            />
            <QuestionCount onChange={onQuestionCountChange} />
            <CustomTree treeData={treeData} />
          </div>
        </div>
      </Spin>

      {contextHolder}
    </div>
  );
};
