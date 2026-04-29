import * as React from "react";
import { Spin, message, Select, Button, Flex, Radio } from "antd";
import { HistoryExercise, TSetting } from "../types";
import { QuestionCount } from "../components/question-count";
import { CustomTree } from "../components/custom-tree";
import { HistoryCard } from "../components/history-card";
import { useNavigate } from "react-router-dom";
import { useSetting } from "../components/hooks";
import {
  SELECTENUM,
  categoryOptions,
  getCategoryRouteConfig,
  isEssayCategory,
} from "../utils/constant";
import { getVscodeApi } from "../utils/vscodeApi";
import { modifyArrayToTree } from "../utils/modifyArray";
import { useVscodeMessage } from "../hooks/useVscodeMessage";
import { CategoryNode } from "../../shared/types";

const vscode = getVscodeApi();

const careerCategoryOptions = [
  { label: "职测", value: SELECTENUM.SYZC },
  { label: "公基", value: SELECTENUM.SYDW },
];

const isCareerCategory = (category?: string) => {
  return category === SELECTENUM.SYZC || category === SELECTENUM.SYDW;
};

export const Home = () => {
  const [messageApi, messageHolder] = message.useMessage();
  const [historyList, setHistoryList] = React.useState<HistoryExercise[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [favoriteQuizLocationName, setFavoriteQuizLocationName] =
    React.useState("");

  const [treeData, setTreeData] = React.useState<
    ReturnType<typeof modifyArrayToTree>
  >([]);
  const { setting, setSetting } = useSetting();

  const navigate = useNavigate();

  React.useEffect(() => {
    const category = setting.categoryId || "xingce";
    const categoryConfig = getCategoryRouteConfig(category);
    pageInit({ categoryId: category });
    getHistory({ count: 15, categoryId: categoryConfig.historyCategoryId, category });
  }, []);

  const setTheme = (theme: TSetting) => {
    setSetting((prev) => ({ ...prev, ...theme }));

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

  const pageInit = (postData?: { categoryId?: string }) => {
    vscode.postMessage({
      command: "pageInit",
      postData,
    });
  };

  const treeClick = (e: { id: number | string }, cacheResult: { keypointIds?: Array<number | string>; combineKey?: string }) => {
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
    const category = setting.categoryId || "xingce";
    const categoryConfig = getCategoryRouteConfig(category);
    navigate("/history", {
      state: {
        count: 15,
        categoryId: categoryConfig.historyCategoryId,
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
    const currentCategory = category || setting.categoryId;
    const categoryConfig = getCategoryRouteConfig(currentCategory);
    vscode.postMessage({
      command: "history",
      postData: {
        category: currentCategory,
        count,
        categoryId: categoryId || categoryConfig.historyCategoryId,
      },
    });
  };

  const applyCategoryChange = (categoryId: string) => {
    const categoryConfig = getCategoryRouteConfig(categoryId);
    pageInit({
      categoryId,
    });
    vscode.postMessage({
      command: "changeCategory",
      postData: {
        categoryId,
      },
    });
    getHistory({
      count: 15,
      categoryId: categoryConfig.historyCategoryId,
      category: categoryId,
    });
    setSetting((prev) => ({ ...prev, categoryId }));
  };

  const onChangeCategory = (e: string) => {
    const nextCategory =
      e === SELECTENUM.SYZC ? SELECTENUM.SYZC : e;
    applyCategoryChange(nextCategory);
  };

  const currentCategory = setting.categoryId || SELECTENUM.XINGCE;
  const mainCategoryValue = isCareerCategory(currentCategory)
    ? SELECTENUM.SYZC
    : currentCategory;

  useVscodeMessage(
    React.useCallback(
      (message) => {
        setLoading(false);

        if (message.command === "setting") {
          setTheme((message.data || {}) as TSetting);
        }
        if (message.command === "init") {
          const data = message.data as {
            favoriteQuizLocationName?: string;
            menu?: CategoryNode[];
            cacheResult?: { keypointIds?: Array<number | string>; combineKey?: string };
          };
          setFavoriteQuizLocationName(data.favoriteQuizLocationName || "");
          const _data = modifyArrayToTree(data.menu || [], data.cacheResult || {}, treeClick);
          setTreeData(_data);
        }
        if (message.command === "message") {
          pageInit({ categoryId: setting.categoryId });
          messageApi.info((message.data as { message?: string })?.message || "");
        }
        if (message.command === "history") {
          setHistoryList((message.data as HistoryExercise[]) || []);
        }
      },
      [messageApi, setting.categoryId],
    ),
  );

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
          <Flex align="center">
            <Select
              options={categoryOptions}
              value={mainCategoryValue}
              style={{ width: 120, margin: "10px" }}
              onChange={onChangeCategory}
            />
            {favoriteQuizLocationName && (
              <span style={{ marginLeft: 4 }}>
                地区：{favoriteQuizLocationName}
              </span>
            )}
          </Flex>
          {isCareerCategory(currentCategory) && (
            <div style={{ margin: "0 10px 10px" }}>
              <Radio.Group
                options={careerCategoryOptions}
                optionType="button"
                value={currentCategory}
                onChange={(e) => applyCategoryChange(e.target.value)}
              />
            </div>
          )}
          {isEssayCategory(setting.categoryId) && (
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

      {messageHolder}
    </div>
  );
};
