import * as React from "react";
import { Button, Spin, Modal } from "antd";
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

import "../style/detail.less";
import { isEssayCategory } from "../utils/constant";
import { useVscodeMessage } from "../hooks/useVscodeMessage";

const vscode = getVscodeApi();
let modalIs = false;

const noopQuestionChange = () => undefined;

interface AnswerLocationState {
  id?: number;
  type?: number;
  combineKey?: string;
}

export const Answer = () => {
  const [modal, contextHolder] = Modal.useModal();
  const [startTime] = React.useState(() => Date.now());
  const answerTimerRef = React.useRef(startTime);
  const [loading, setLoading] = React.useState(true);

  const page = 1;
  const [questionData, setQuestionData] = React.useState<TQuestionData>();
  const [solutionData, setSolutionData] = React.useState<TSolutionData>();
  const { setting } = useSetting();

  const navigate = useNavigate();
  const location = useLocation();
  const { id, type = 1, combineKey: defaultCombineKey = "" } =
    ((location.state || {}) as AnswerLocationState);
  const [combineKey, setCombineKey] = React.useState(defaultCombineKey);

  React.useEffect(() => {
    getSolution({
      category: setting.categoryId,
      id,
      combineKey: combineKey,
      type,
    });
  }, []);

  const getSolution = ({
    category,
    id,
    combineKey,
    type = 1,
  }: {
    category?: string;
    id?: number;
    combineKey?: string | null;
    type?: number;
  }) => {
    setLoading(true);
    vscode.postMessage({
      command: "getSolution",
      postData: { type, category, id, combineKey },
    });
  };

  const onBack = () => {
    navigate(-1);
  };

  const getAnswerTime = React.useCallback(() => {
    const now = Date.now();
    const time = Math.max(
      0,
      Math.floor((now - answerTimerRef.current) / 1000),
    );
    answerTimerRef.current = now;
    return time;
  }, []);

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
        exerciseId: solutionData?.exerciseId || questionData?.exerciseId,
      },
    });
  };

  const solutions = groupByMaterialIndexesTo2DArray(
    solutionData?.solutions || [],
  );

  const onJump = () => {
    vscode.postMessage({
      command: "jumpFenbi",
      postData: {
        category: setting.categoryId,
        exerciseId: solutionData?.exerciseId || questionData?.exerciseId,
      },
    });
  };

  const list = solutions;
  const materials = solutionData?.materials || questionData?.materials || [];

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

            <Button onClick={onJump}>跳转粉笔网址</Button>
          </div>
          <div>
            答对题目数：{solutionData?.correctCount} /{" "}
            {solutionData?.questionCount}{" "}
          </div>

          <div style={{ height: "10px" }}></div>

          <div>
            {list.map((item: TSolutionItem[], index: number) => {
              if (isEssayCategory(setting.categoryId)) {
                return (
                  <ShenlunItem
                    key={`${page}-${index}`}
                    onChange={onShenlunChange}
                    data={item}
                    index={index}
                    materials={materials}
                  />
                );
              }
              return (
                <QuestionItem
                  key={`${page}-${index}`}
                  onChange={noopQuestionChange}
                  data={item}
                  index={index}
                  materials={materials}
                />
              );
            })}
          </div>
        </div>
      </Spin>

      {contextHolder}
    </div>
  );
};
