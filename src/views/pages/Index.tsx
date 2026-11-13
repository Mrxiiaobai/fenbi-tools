import * as React from "react";
import {
  Button,
  ColorPicker,
  Flex,
  InputNumber,
  Modal,
  Radio,
  Select,
  Spin,
  Switch,
  message,
} from "antd";
import { HistoryExercise, TSetting } from "../types";
import { QuestionCount } from "../components/question-count";
import { CustomTree } from "../components/custom-tree";
import { HistoryCard } from "../components/history-card";
import { useNavigate } from "react-router-dom";
import { useSetting } from "../components/hooks";
import {
  SELECTENUM,
  getCategoryOptions,
  getCategoryRouteConfig,
  isInterviewCategory,
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

const templateYearScopeOptions = [
  { label: "不限", value: 0 },
  { label: "近5年", value: 5 },
  { label: "近10年", value: 10 },
];

const settingPanelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  background: "#ffffff",
  color: "#1f1f1f",
};

const settingLabelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 6,
  color: "#333333",
  fontSize: 12,
};

const settingControlStyle: React.CSSProperties = {
  width: "100%",
};

const settingHintStyle: React.CSSProperties = {
  border: "1px solid #f0f0f0",
  borderRadius: 6,
  padding: "8px 10px",
  background: "#fafafa",
  color: "#595959",
  fontSize: 12,
  lineHeight: 1.6,
};

const settingPanelActionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
  marginTop: 4,
};

const settingsModalStyles = {
  mask: {
    backgroundColor: "transparent",
  },
  content: {
    backgroundColor: "#ffffff",
    color: "#1f1f1f",
    padding: 12,
  },
  header: {
    backgroundColor: "#ffffff",
    color: "#1f1f1f",
    marginBottom: 12,
  },
  body: {
    backgroundColor: "#ffffff",
    color: "#1f1f1f",
    padding: 0,
  },
  footer: {
    backgroundColor: "#ffffff",
    marginTop: 12,
  },
};

const SettingsPanel = ({
  settingsDraft,
  updateSettingsDraft,
}: {
  settingsDraft: TSetting;
  updateSettingsDraft: <TKey extends keyof TSetting>(
    key: TKey,
    value: TSetting[TKey],
  ) => void;
  saveSettings: () => void;
  closeSettings: () => void;
}) => {
  return (
    <div style={settingPanelStyle}>
      <div>
        <span style={settingLabelStyle}>Cookie 设置</span>
        <div style={settingHintStyle}>
          请前往首选项-&gt;设置-&gt; 搜索fenbi，设置cookie
        </div>
      </div>

      <div>
        <span style={settingLabelStyle}>字体颜色</span>
        <ColorPicker
          size="small"
          showText
          value={String(settingsDraft.color || "#ffffff")}
          onChange={(_, hex) => updateSettingsDraft("color", hex)}
        />
      </div>

      <div>
        <span style={settingLabelStyle}>背景颜色</span>
        <ColorPicker
          size="small"
          showText
          value={String(settingsDraft.backgroundColor || "#21222b")}
          onChange={(_, hex) => updateSettingsDraft("backgroundColor", hex)}
        />
      </div>

      <div>
        <span style={settingLabelStyle}>选项排除线</span>
        <Switch
          size="small"
          checked={Boolean(settingsDraft.needLineThrough)}
          onChange={(checked) =>
            updateSettingsDraft("needLineThrough", checked)
          }
        />
      </div>

      <div>
        <span style={settingLabelStyle}>字体大小</span>
        <InputNumber
          size="small"
          min={10}
          max={28}
          addonAfter="px"
          value={Number(settingsDraft.fontSize) || 12}
          style={settingControlStyle}
          onChange={(value) =>
            updateSettingsDraft("fontSize", Number(value) || 12)
          }
        />
      </div>

      <div>
        <span style={settingLabelStyle}>正确答案颜色</span>
        <ColorPicker
          size="small"
          showText
          value={String(settingsDraft.correctColor || "#30c9a1")}
          onChange={(_, hex) => updateSettingsDraft("correctColor", hex)}
        />
      </div>

      <div>
        <span style={settingLabelStyle}>错误答案颜色</span>
        <ColorPicker
          size="small"
          showText
          value={String(settingsDraft.wrongColor || "#ff4d4f")}
          onChange={(_, hex) => updateSettingsDraft("wrongColor", hex)}
        />
      </div>

      <div>
        <span style={settingLabelStyle}>按钮 / Card / 下拉框边框颜色</span>
        <ColorPicker
          size="small"
          showText
          value={String(settingsDraft.buttonBorderColor || "#ffffff")}
          onChange={(_, hex) => updateSettingsDraft("buttonBorderColor", hex)}
        />
      </div>

      <div>
        <span style={settingLabelStyle}>画板画笔颜色</span>
        <ColorPicker
          size="small"
          showText
          value={String(settingsDraft.canvasBrushColor || "red")}
          onChange={(_, hex) => updateSettingsDraft("canvasBrushColor", hex)}
        />
      </div>

      <div>
        <span style={settingLabelStyle}>画板画笔粗细</span>
        <InputNumber
          size="small"
          min={1}
          max={30}
          addonAfter="px"
          value={Number(settingsDraft.canvasBrushWidth) || 3}
          style={settingControlStyle}
          onChange={(value) => {
            updateSettingsDraft("canvasBrushWidth", Number(value) || 3);
          }}
        />
      </div>

      <div style={settingPanelActionsStyle} />
    </div>
  );
};

const isCareerCategory = (category?: string) => {
  return category === SELECTENUM.SYZC || category === SELECTENUM.SYDW;
};

const canShowSmartPaper = (category?: string) => {
  return (
    category === SELECTENUM.XINGCE ||
    category === SELECTENUM.SYZC ||
    category === SELECTENUM.SYDW
  );
};

const canShowErrors = (category?: string) => {
  return (
    category === SELECTENUM.XINGCE ||
    category === SELECTENUM.SYZC ||
    category === SELECTENUM.SYDW
  );
};

const canShowPastPapers = (category?: string) => {
  return Boolean(category) && !isInterviewCategory(category);
};

export const Home = () => {
  const [messageApi, messageHolder] = message.useMessage();
  const [historyList, setHistoryList] = React.useState<HistoryExercise[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [favoriteQuizLocationName, setFavoriteQuizLocationName] =
    React.useState("");
  const [favoriteQuizCoursePrefixes, setFavoriteQuizCoursePrefixes] =
    React.useState<string[]>([]);
  const [smartModalOpen, setSmartModalOpen] = React.useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = React.useState(false);
  const [smartYearScope, setSmartYearScope] = React.useState(0);
  const [settingsDraft, setSettingsDraft] = React.useState<TSetting>({});

  const [treeData, setTreeData] = React.useState<
    ReturnType<typeof modifyArrayToTree>
  >([]);
  const { setting, setSetting } = useSetting();

  const navigate = useNavigate();

  React.useEffect(() => {
    const category = setting.categoryId || "xingce";
    const categoryConfig = getCategoryRouteConfig(category);
    pageInit({ categoryId: category });
    getHistory({
      count: 15,
      categoryId: categoryConfig.historyCategoryId,
      category,
    });
  }, []);

  const pageInit = (postData?: { categoryId?: string }) => {
    vscode.postMessage({
      command: "pageInit",
      postData,
    });
  };

  const treeClick = (
    e: { id: number | string; name?: string },
    cacheResult: { keypointIds?: Array<number | string>; combineKey?: string },
  ) => {
    const key = e.id;

    setLoading(true);
    if (isInterviewCategory(setting.categoryId)) {
      navigate("/sydwms-detail", {
        state: {
          category: setting.categoryId,
          keypointId: key,
          title: e.name,
          questionIndex: 0,
        },
      });
      return;
    }

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
    if (isInterviewCategory(category)) return;

    const categoryConfig = getCategoryRouteConfig(category);
    navigate("/history", {
      state: {
        count: 15,
        categoryId: categoryConfig.historyCategoryId,
      },
    });
  };

  const goErrors = () => {
    navigate("/errors", {
      state: {
        category: setting.categoryId || SELECTENUM.XINGCE,
      },
    });
  };

  const goPastPapers = () => {
    navigate("/papers", {
      state: {
        category: setting.categoryId || SELECTENUM.XINGCE,
      },
    });
  };

  const goDetail = ({
    id,
    combineKey,
    type,
    mode,
    smartYearScope,
  }: {
    id?: number;
    combineKey?: string;
    type?: number;
    mode?: "quick" | "smart";
    smartYearScope?: number;
  }) => {
    navigate("/detail", {
      state: {
        id,
        combineKey,
        type,
        mode,
        smartYearScope,
      },
    });
  };

  const openSmartPaperModal = () => {
    setLoading(true);
    vscode.postMessage({
      command: "getUserTemplateInfo",
    });
  };

  const openSettingsModal = () => {
    setSettingsDraft({
      color: setting.color || "#ffffff",
      backgroundColor: setting.backgroundColor || "#21222b",
      needLineThrough: Boolean(setting.needLineThrough),
      fontSize: Number(setting.fontSize) || 12,
      correctColor: setting.correctColor || "#30c9a1",
      wrongColor: setting.wrongColor || "#ff4d4f",
      buttonBorderColor:
        setting.buttonBorderColor || setting.cardBorderColor || "#ffffff",
      canvasBrushColor: setting.canvasBrushColor || "red",
      canvasBrushWidth: Number(setting.canvasBrushWidth) || 3,
    });
    setSettingsModalOpen(true);
  };

  const updateSettingsDraft = <TKey extends keyof TSetting>(
    key: TKey,
    value: TSetting[TKey],
  ) => {
    setSettingsDraft((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const saveSettings = () => {
    vscode.postMessage({
      command: "updateSettings",
      postData: {
        color: settingsDraft.color || "#ffffff",
        backgroundColor: settingsDraft.backgroundColor || "#21222b",
        needLineThrough: Boolean(settingsDraft.needLineThrough),
        fontSize: Number(settingsDraft.fontSize) || 12,
        correctColor: settingsDraft.correctColor || "#30c9a1",
        wrongColor: settingsDraft.wrongColor || "#ff4d4f",
        buttonBorderColor: settingsDraft.buttonBorderColor || "#ffffff",
        canvasBrushColor: settingsDraft.canvasBrushColor || "red",
        canvasBrushWidth: Number(settingsDraft.canvasBrushWidth) || 3,
      },
    });
    setSetting((prev) => ({
      ...prev,
      ...settingsDraft,
    }));
    setSettingsModalOpen(false);
  };

  const startSmartPaper = () => {
    setSmartModalOpen(false);
    goDetail({
      mode: "smart",
      smartYearScope,
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
    if (isInterviewCategory(currentCategory)) {
      setHistoryList([]);
      return;
    }

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
    const nextCategory = e === SELECTENUM.SYZC ? SELECTENUM.SYZC : e;
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

        if (message.command === "init") {
          const data = message.data as {
            favoriteQuizLocationName?: string;
            favoriteQuizCoursePrefixes?: string[];
            menu?: CategoryNode[];
            cacheResult?: {
              keypointIds?: Array<number | string>;
              combineKey?: string;
            };
          };
          setFavoriteQuizLocationName(data.favoriteQuizLocationName || "");
          setFavoriteQuizCoursePrefixes(data.favoriteQuizCoursePrefixes || []);
          const _data = modifyArrayToTree(
            data.menu || [],
            data.cacheResult || {},
            treeClick,
          );
          setTreeData(_data);
        }
        if (message.command === "message") {
          pageInit({ categoryId: setting.categoryId });
          messageApi.info(
            (message.data as { message?: string })?.message || "",
          );
        }
        if (message.command === "history") {
          setHistoryList((message.data as HistoryExercise[]) || []);
        }
        if (message.command === "templateInfo") {
          const data = message.data as { yearScope?: number };
          const yearScope = Number(data.yearScope ?? 0);
          setSmartYearScope(
            templateYearScopeOptions.some((item) => item.value === yearScope)
              ? yearScope
              : 0,
          );
          setSmartModalOpen(true);
        }
        if (message.command === "settingsUpdated") {
          messageApi.success(
            (message.data as { message?: string })?.message || "设置已保存",
          );
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
              style={{ borderColor: "var(--button-border-color)" }}
              onClick={openSettingsModal}
            >
              设置
            </Button>
            <Button
              type="link"
              size="small"
              style={{ borderColor: "var(--button-border-color)" }}
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
              style={{ borderColor: "var(--button-border-color)" }}
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
          <Flex align="center">
            <Select
              options={getCategoryOptions(favoriteQuizCoursePrefixes)}
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
          {(canShowSmartPaper(currentCategory) ||
            canShowPastPapers(currentCategory)) && (
            <Flex
              justify="flex-start"
              align="center"
              gap={8}
              style={{ margin: "0 10px 10px" }}
            >
              {canShowPastPapers(currentCategory) && (
                <Button
                  type="link"
                  style={{ borderColor: "var(--button-border-color)" }}
                  onClick={goPastPapers}
                >
                  历年试卷
                </Button>
              )}
              {canShowSmartPaper(currentCategory) && (
                <>
                  {canShowErrors(currentCategory) && (
                    <Button
                      type="link"
                      style={{ borderColor: "var(--button-border-color)" }}
                      onClick={goErrors}
                    >
                      我的错题
                    </Button>
                  )}
                  <Button
                    type="link"
                    style={{ borderColor: "var(--button-border-color)" }}
                    onClick={() => {
                      goDetail({
                        mode: "quick",
                      });
                    }}
                  >
                    快速练习
                  </Button>
                  <Button
                    type="link"
                    style={{ borderColor: "var(--button-border-color)" }}
                    onClick={openSmartPaperModal}
                  >
                    智能组卷
                  </Button>
                </>
              )}
            </Flex>
          )}
          {(currentCategory === SELECTENUM.SHENLUN ||
            currentCategory === SELECTENUM.ZHYYNL) && (
            <div>
              ps：申论功能需要前往粉笔官网充vip才能交卷，与该插件无关，由于没有vip，交卷及后续功能暂无法支持，感谢理解！
            </div>
          )}
          {isInterviewCategory(currentCategory) && (
            <div>
              ps：面试功能需要前往粉笔官网充vip才能显示并查看解析视频、详细解析，没有vip仅显示问题与部分解析，与该插件无关。
            </div>
          )}
          <div className="menu-container">
            {!isInterviewCategory(currentCategory) && (
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
            )}
            {!isInterviewCategory(currentCategory) && (
              <QuestionCount onChange={onQuestionCountChange} />
            )}
            <CustomTree treeData={treeData} />
          </div>
        </div>
      </Spin>

      <Modal
        title="智能组卷"
        open={smartModalOpen}
        okText="生成试卷"
        cancelText="取消"
        onOk={startSmartPaper}
        onCancel={() => setSmartModalOpen(false)}
      >
        <div style={{ marginBottom: 12 }}>出题年份</div>
        <Radio.Group
          options={templateYearScopeOptions}
          optionType="button"
          value={smartYearScope}
          onChange={(event) => setSmartYearScope(event.target.value)}
        />
      </Modal>

      <Modal
        className="theme_exempt"
        title="设置"
        open={settingsModalOpen}
        width={280}
        okText="保存"
        cancelText="取消"
        maskStyle={settingsModalStyles.mask}
        styles={{
          content: settingsModalStyles.content,
          header: settingsModalStyles.header,
          body: settingsModalStyles.body,
          footer: settingsModalStyles.footer,
        }}
        onOk={saveSettings}
        onCancel={() => setSettingsModalOpen(false)}
      >
        <SettingsPanel
          settingsDraft={settingsDraft}
          updateSettingsDraft={updateSettingsDraft}
          saveSettings={saveSettings}
          closeSettings={() => setSettingsModalOpen(false)}
        />
      </Modal>

      {messageHolder}
    </div>
  );
};
