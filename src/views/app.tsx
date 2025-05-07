import * as React from "react";
import { Button, Space, Spin, Menu, Modal, message } from "antd";
import { groupByMaterialIndexesTo2DArray } from "./utils/analyze";
import {
  TCacheData,
  TQuestionData,
  TQuestionItem,
  TSetting,
  TSolutionData,
} from "./types";
import { QuestionItem } from "./components/question-item";
import { QuestionCount } from "./components/question-count";
import { ThemeContext } from "./context/themeContext";
import "./style/index.less";

declare const acquireVsCodeApi: any;

interface TLastAnswerRecord {
  // lastTime: number;
  lastCount: number | null;
  lastAnswer: number | null;
  lastQuestionId: number | null | undefined;
}

const vscode = acquireVsCodeApi();

export const App = () => {
  const [modal, contextHolder] = Modal.useModal();
  const [messageApi, messageHoder] = message.useMessage();
  const [isFirst, setFirst] = React.useState(false);
  const [startTime, setStartTime] = React.useState(0);
  const [lastAnswerRecord, setLastAnswerRecord] =
    React.useState<TLastAnswerRecord>({
      // lastTime: 0,
      lastCount: null,
      lastAnswer: null,
      lastQuestionId: null,
    });
  const [loading, setLoading] = React.useState(true);

  const [page, setPage] = React.useState<number>(1);
  const [treeData, setTreeData] = React.useState([]);
  const [questionData, setQuestionData] = React.useState<TQuestionData>();
  const [solutionData, setSolutionData] = React.useState<TSolutionData>();
  const [cacheData, setCacheData] = React.useState<TCacheData>();
  const [setting, setSetting] = React.useState<TSetting>({} as TSetting);

  React.useEffect(() => {
    vscode.postMessage({
      command: "pageInit",
    });
    window.addEventListener("message", (event: any) => {
      const message = event.data;
      setLoading(false);

      if (message.command === "setting") setTheme(message.data);
      if (message.command === "init") setTreeData(message.data);
      if (message.command === "pageCache") setCacheData(message.data);
      if (message.command === "getQuestion") setQuestionData(message.data);
      if (message.command === "message") {
        pageInit();
        messageApi.info(message.data.message);
      }
      if (message.command === "solution") {
        setPage((prev) => prev + 1);
        setSolutionData(message.data);
      }
      if (message.command === "webviewHide") {
        vscode.postMessage({
          command: "cacheData",
          postData: {
            isFirst,
            startTime,
            lastAnswerRecord,
            questionData: questionData,
            solutionData: solutionData,
            cacheData: cacheData,
            page,
          },
        });
      }
      if (message.command === "webviewShow") {
        setFirst(message.data.isFirst);
        setStartTime(message.data.startTime);
        setLastAnswerRecord(message.data.lastAnswerRecord);
        setQuestionData(message.data.questionData);
        setSolutionData(message.data.solutionData);
        setCacheData(message.data.cacheData);
        setPage(message.data.page);
      }
    });
  }, []);

  React.useEffect(() => {
    if (isFirst) return;
    if ((questionData?.questions || []).length > 0) {
      setFirst(true);
      setStartTime(Date.now());
      // setLastAnswerRecord({
      //   // lastTime: Date.now(),
      //   lastCount: null,
      //   lastAnswer: null,
      //   lastQuestionId: questionData?.questions[0].id,
      // });
    }
  }, [questionData?.questions]);

  const setTheme = (theme: TSetting) => {
    setSetting(theme);

    document.documentElement.style.setProperty(
      "--primary-color",
      theme.color || "#ffffff"
    );
    document.documentElement.style.setProperty(
      "--primary-backgroundColor",
      theme.backgroundColor || "#ffffff"
    );
  };

  const pageInit = () => {
    vscode.postMessage({
      command: "pageInit",
    });
  };

  const menuClick = ({ key }: any) => {
    setLoading(true);

    let exerciseId: number | null = null;
    if (cacheData?.keypointIds?.includes(Number(key))) {
      exerciseId = cacheData?.exerciseId;
    }
    vscode.postMessage({
      command: "getQuestion",
      postData: { id: key, exerciseId },
    });
    setPage((prev) => prev + 1);
  };

  const onBack = () => {
    if (page == 2) {
      setLoading(true);
      vscode.postMessage({
        command: "pageInit",
      });
    }
    setPage((prev) => prev - 1);
  };

  const onRaioChange = (e: any, item: TQuestionItem, index: number) => {
    const ifDifferent =
      lastAnswerRecord.lastCount !== null &&
      index !== lastAnswerRecord.lastCount;
    const currentLastAnswerRecord: TLastAnswerRecord = {
      lastQuestionId: item.id,
      lastCount: index,
      lastAnswer: e.target.value,
    };
    let params = { ...currentLastAnswerRecord };
    if (ifDifferent)
      params = { ...currentLastAnswerRecord, ...lastAnswerRecord };
    vscode.postMessage({
      command: "answer",
      inc: ifDifferent ? true : false,
      postData: {
        // study参数
        ...item,
        index,
        // 初始时间
        startTime: startTime,
        // inc 参数
        exerciseId: questionData?.exerciseId,
        ...params,
      },
    });

    // 每次保存最新纪录
    setLastAnswerRecord(currentLastAnswerRecord);
  };

  const onSubmit = () => {
    modal.confirm({
      title: "确认提交",
      onOk: () => {
        setLoading(true);
        vscode.postMessage({
          command: "submit",
          postData: {
            ...lastAnswerRecord,
            // 初始时间
            startTime: startTime,
            exerciseId: questionData?.exerciseId,
          },
        });
      },
    });
  };

  const questions = groupByMaterialIndexesTo2DArray(
    questionData?.questions || []
  );

  const solutions = groupByMaterialIndexesTo2DArray(
    solutionData?.solutions || []
  );

  const onJump = () => {
    console.log(questionData?.exerciseId, "+id+");
    vscode.postMessage({
      command: "jumpFenbi",
      postData: {
        exerciseId: questionData?.exerciseId,
      },
    });
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

  const obj: { [key: string]: any[] } = {
    1: [],
    2: questions,
    3: solutions,
  };

  const list = obj[page];

  return (
    <div>
      <ThemeContext.Provider value={setting}>
        <Spin tip="loading..." spinning={loading}>
          {page == 1 ? (
            <div>
              <div className="menu-container">
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
          ) : null}

          {page >= 2 ? (
            <div className="question-container">
              <Space wrap>
                <Button type="text" onClick={onBack}>
                  返回上一页
                </Button>
                {page == 2 && (
                  <Button
                    type="primary"
                    style={{ borderColor: "white" }}
                    onClick={onSubmit}
                  >
                    交卷
                  </Button>
                )}
                {page == 3 && <Button onClick={onJump}>跳转粉笔网址</Button>}
              </Space>

              {page == 3 && (
                <div>
                  答对题目数：{solutionData?.correctCount} /{" "}
                  {solutionData?.questionCount}{" "}
                </div>
              )}

              <div style={{ height: "10px" }}></div>

              <div>
                {(list || []).map((item: any, index: number) => {
                  return (
                    <QuestionItem
                      key={`${page}-${index}`}
                      onChange={onRaioChange}
                      data={item}
                      index={index}
                      materials={questionData?.materials || []}
                    />
                  );
                })}
              </div>

              {page == 2 && (
                <Button
                  type="primary"
                  style={{ borderColor: "white" }}
                  onClick={onSubmit}
                >
                  交卷
                </Button>
              )}
            </div>
          ) : null}
        </Spin>

        {contextHolder}
      </ThemeContext.Provider>
    </div>
  );
};
