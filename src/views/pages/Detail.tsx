import * as React from "react";
import { Button, Space, Spin, Modal, message } from "antd";
import { groupByMaterialIndexesTo2DArray } from "../utils/analyze";
import {
  TCacheData,
  TQuestionData,
  TQuestionItem,
  TSolutionData,
} from "../types";
import { QuestionItem } from "../components/question-item";
import { useNavigate, useLocation } from "react-router-dom";
import { useSetting } from "../components/hooks";

import { getVscodeApi } from "../utils/vscodeApi";
import { ShenlunItem } from "../components/shenlun-item";

import CanvasDrawing from "../components/canvas-drawing";
import "../style/detail.less";
import { isEssayCategory } from "../utils/constant";

interface TLastAnswerRecord {
  // lastTime: number;
  lastCount: number | null;
  lastAnswer: number | null;
  lastQuestionId: number | null | undefined;
}

const vscode = getVscodeApi();
let modalIs = false;
export const Detail = () => {
  const [modal, contextHolder] = Modal.useModal();
  const [isFirst, setFirst] = React.useState(false);
  const [startTime, setStartTime] = React.useState(0);
  // const [showDraw, setShowDraw] = React.useState(false);
  const [lastAnswerRecord, setLastAnswerRecord] =
    React.useState<TLastAnswerRecord>({
      // lastTime: 0,
      lastCount: null,
      lastAnswer: null,
      lastQuestionId: null,
    });
  const [loading, setLoading] = React.useState(true);

  const [page, setPage] = React.useState<number>(1);
  const [questionData, setQuestionData] = React.useState<TQuestionData>();
  const [solutionData, setSolutionData] = React.useState<TSolutionData>();
  const [cacheData, setCacheData] = React.useState<TCacheData>();
  const { setting, setSetting } = useSetting();

  const navigate = useNavigate();
  const location = useLocation();
  const { id = "", type = 1 } = location.state || {};
  const defaultCombineKey = location.state?.combineKey || "";
  const [combineKey, setCombineKey] = React.useState(defaultCombineKey);

  React.useEffect(() => {
    getQuestion({ category: setting.categoryId, id, combineKey, type });
  }, []);

  React.useEffect(() => {
    window.addEventListener("message", (event: any) => {
      const _message = event.data;
      setLoading(false);

      if (_message.command === "pageCache") setCacheData(_message.data);
      if (_message.command === "getQuestion") {
        setQuestionData(_message.data);
        setCombineKey(_message.data.combineKey);
      }
      if (_message.command === "message") {
        if (modalIs) return;
        modal.error({
          title: "提示",
          content: _message.data.message,
          onOk: () => {
            modalIs = false;
          },
        });
        modalIs = true;
      }
      if (_message.command === "solution") {
        setPage(2);
        setSolutionData(_message.data);
      }
    });
  }, []);

  React.useEffect(() => {
    if (isFirst) return;
    if ((questionData?.questions || []).length > 0) {
      setFirst(true);
      setStartTime(Date.now());
    }
  }, [questionData?.questions]);

  const getQuestion = ({
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
    if (type == 2) {
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

  const onRaioChange = (e: any, item: TQuestionItem, index: number) => {
    vscode.postMessage({
      command: "answer",
      inc: true,
      postData: {
        ...item,
        startTime: startTime,
        // inc 参数
        combineKey: combineKey,
        category: setting.categoryId,
        answer: e.target.value,
        exerciseId: questionData?.exerciseId,
        // ...params,
      },
    });
  };

  const onShenlunChange = (text: string) => {
    vscode.postMessage({
      command: "answer",
      inc: true,
      postData: {
        startTime: startTime,
        combineKey: combineKey,
        category: setting.categoryId,
        answer: text,
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
            // ...lastAnswerRecord,
            // 初始时间
            startTime: startTime,
            // exerciseId: questionData?.exerciseId,
            combineKey: combineKey,
            category: setting.categoryId,
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
    vscode.postMessage({
      command: "jumpFenbi",
      postData: {
        category: setting.categoryId,
        exerciseId: questionData?.exerciseId,
      },
    });
  };

  const obj: { [key: string]: any[] } = {
    1: questions,
    2: solutions,
  };

  const list = obj[page];

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
            {(list || []).map((item: any, index: number) => {
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

