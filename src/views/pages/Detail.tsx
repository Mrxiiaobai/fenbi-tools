import * as React from "react";
import { Button, Spin, Modal } from "antd";
import { RadioChangeEvent } from "antd/es/radio";
import { groupByMaterialIndexesTo2DArray } from "../utils/analyze";
import {
  TQuestionData,
  TQuestionItem,
  TSolutionData,
  TSolutionItem,
} from "../types";
import { QuestionItem } from "../components/question-item";
import { useNavigate, useLocation } from "react-router-dom";
import { useSetting } from "../components/hooks";

import { getVscodeApi } from "../utils/vscodeApi";
import { ShenlunItem } from "../components/shenlun-item";

import CanvasDrawing from "../components/canvas-drawing";
import "../style/detail.less";
import { isEssayCategory } from "../utils/constant";
import { useVscodeMessage } from "../hooks/useVscodeMessage";

const vscode = getVscodeApi();
let modalIs = false;

interface DetailLocationState {
  id?: number;
  type?: number;
  combineKey?: string;
  mode?: "quick" | "smart";
  smartYearScope?: number;
}

export const Detail = () => {
  const [modal, contextHolder] = Modal.useModal();
  const [isFirst, setFirst] = React.useState(false);
  const [startTime, setStartTime] = React.useState(0);
  const answerTimerRef = React.useRef(Date.now());
  const [loading, setLoading] = React.useState(true);

  const [page, setPage] = React.useState<number>(1);
  const [questionData, setQuestionData] = React.useState<TQuestionData>();
  const [solutionData, setSolutionData] = React.useState<TSolutionData>();
  const { setting } = useSetting();

  const navigate = useNavigate();
  const location = useLocation();
  const {
    id,
    type = 1,
    combineKey: defaultCombineKey = "",
    mode,
    smartYearScope,
  } =
    ((location.state || {}) as DetailLocationState);
  const [combineKey, setCombineKey] = React.useState(defaultCombineKey);

  React.useEffect(() => {
    getQuestion({
      category: setting.categoryId,
      id,
      combineKey,
      type,
      mode,
      smartYearScope,
    });
  }, []);

  React.useEffect(() => {
    if (isFirst) return;
    if ((questionData?.questions || []).length > 0) {
      const now = Date.now();
      setFirst(true);
      setStartTime(now);
      answerTimerRef.current = now;
    }
  }, [questionData?.questions]);

  const getAnswerTime = React.useCallback(() => {
    const now = Date.now();
    const time = Math.max(
      0,
      Math.floor((now - answerTimerRef.current) / 1000),
    );
    answerTimerRef.current = now;
    return time;
  }, []);

  const getQuestion = ({
    category,
    id,
    combineKey,
    type = 1,
    mode,
    smartYearScope,
  }: {
    category?: string;
    id?: number;
    combineKey?: string | null;
    type?: number;
    mode?: "quick" | "smart";
    smartYearScope?: number;
  }) => {
    setLoading(true);
    if (mode === "smart") {
      vscode.postMessage({
        command: "getSmartQuestion",
        postData: { category, combineKey, yearScope: smartYearScope },
      });
      return;
    }
    if (mode === "quick" || type == 2) {
      vscode.postMessage({
        command: "getQuickQuestion",
        postData: { category, combineKey },
      });
      return;
    }
    vscode.postMessage({
      command: "getQuestion",
      postData: { category, id, combineKey },
    });
  };

  const onBack = () => {
    navigate(-1);
  };

  const onRaioChange = (e: RadioChangeEvent, item: TQuestionItem) => {
    vscode.postMessage({
      command: "answer",
      inc: true,
      postData: {
        ...item,
        startTime: startTime,
        time: getAnswerTime(),
        combineKey: combineKey,
        category: setting.categoryId,
        answer: e.target.value,
        exerciseId: questionData?.exerciseId,
      },
    });
  };

  const onShenlunChange = (text: string, item: TQuestionItem | TSolutionItem) => {
    vscode.postMessage({
      command: "answer",
      inc: true,
      postData: {
        ...item,
        startTime: startTime,
        time: getAnswerTime(),
        combineKey: combineKey,
        category: setting.categoryId,
        answer: text,
        exerciseId: questionData?.exerciseId,
      },
    });
  };

  const onSubmit = () => {
    modal.confirm({
      title: "确认提交",
      onOk: () => {
        setLoading(true);
        vscode.postMessage({
          command: "submit",
          postData: {
            startTime: startTime,
            combineKey: combineKey,
            category: setting.categoryId,
          },
        });
      },
    });
  };

  const questions = groupByMaterialIndexesTo2DArray(
    questionData?.questions || [],
  );

  const solutions = groupByMaterialIndexesTo2DArray(
    solutionData?.solutions || [],
  );

  const onJump = () => {
    vscode.postMessage({
      command: "jumpFenbi",
      postData: {
        category: setting.categoryId,
        exerciseId: questionData?.exerciseId,
      },
    });
  };

  const list: Array<TQuestionItem[] | TSolutionItem[]> =
    page === 1 ? questions : solutions;

  useVscodeMessage((message) => {
    setLoading(false);

    if (message.command === "getQuestion") {
      const data = message.data as TQuestionData;
      setQuestionData(data);
      setCombineKey(data.combineKey || "");
    }
    if (message.command === "message") {
      if (modalIs) return;
      modal.error({
        title: "提示",
        content: (message.data as { message?: string })?.message || "",
        onOk: () => {
          modalIs = false;
        },
      });
      modalIs = true;
    }
    if (message.command === "solution") {
      setPage(2);
      setSolutionData(message.data as TSolutionData);
    }
  });

  return (
    <div className="detail_page">
      <Spin tip="loading..." spinning={loading}>
        <div className="question-container">
          <div className="top-bar">
            <Button type="text" onClick={onBack}>
              返回上一页
            </Button>
            {page == 1 && (
              <>
                <Button
                  type="primary"
                  style={{ borderColor: "white" }}
                  onClick={onSubmit}
                >
                  交卷
                </Button>
              </>
            )}

            {page == 2 && <Button onClick={onJump}>跳转粉笔网址</Button>}
          </div>
          {page == 2 && (
            <div>
              答对题目数：{solutionData?.correctCount} /{" "}
              {solutionData?.questionCount}{" "}
            </div>
          )}

          <div style={{ height: "10px" }}></div>

          <div>
            {list.map((item, index) => {
              if (isEssayCategory(setting.categoryId)) {
                return (
                  <ShenlunItem
                    key={`${page}-${index}`}
                    onChange={onShenlunChange}
                    data={item}
                    index={index}
                    materials={questionData?.materials || []}
                  />
                );
              }
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

          <CanvasDrawing />

          {page == 1 && (
            <Button
              type="primary"
              style={{ borderColor: "white" }}
              onClick={onSubmit}
            >
              交卷
            </Button>
          )}
        </div>
      </Spin>

      {contextHolder}
    </div>
  );
};
