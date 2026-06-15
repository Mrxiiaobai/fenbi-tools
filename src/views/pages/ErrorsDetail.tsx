import * as React from "react";
import { Button, Modal, Pagination, Spin } from "antd";
import { RadioChangeEvent } from "antd/es/radio";
import { useLocation, useNavigate } from "react-router-dom";
import { groupByMaterialIndexesTo2DArray } from "../utils/analyze";
import {
  TQuestionData,
  TQuestionItem,
  TSolutionData,
} from "../types";
import { QuestionItem } from "../components/question-item";
import CanvasDrawing from "../components/canvas-drawing";
import { getVscodeApi } from "../utils/vscodeApi";
import { SELECTENUM } from "../utils/constant";
import { useVscodeMessage } from "../hooks/useVscodeMessage";

import "../style/detail.less";

const vscode = getVscodeApi();
const ERROR_PAGE_SIZE = 10;
let modalIs = false;

interface ErrorsDetailLocationState {
  category?: string;
  categoryId?: number | string;
  errorTotal?: number;
  errorPageSize?: number;
  fallbackQuestionIds?: Array<number | string>;
  title?: string;
}

const getQuestionKey = (item: TQuestionItem) => {
  return String(item.globalId || item.id || "");
};

export const ErrorsDetail = () => {
  const [modal, contextHolder] = Modal.useModal();
  const [loading, setLoading] = React.useState(true);
  const [viewMode, setViewMode] = React.useState<"question" | "solution">(
    "question",
  );
  const [questionData, setQuestionData] = React.useState<TQuestionData>();
  const [solutionData, setSolutionData] = React.useState<TSolutionData>();
  const [currentPage, setCurrentPage] = React.useState(1);
  const [currentQuestionIds, setCurrentQuestionIds] = React.useState<
    Array<number | string>
  >([]);
  const answerTimerRef = React.useRef(Date.now());

  const navigate = useNavigate();
  const location = useLocation();
  const {
    category = SELECTENUM.XINGCE,
    categoryId,
    errorTotal = 0,
    errorPageSize = ERROR_PAGE_SIZE,
    fallbackQuestionIds = [],
    title = "我的错题",
  } = (location.state || {}) as ErrorsDetailLocationState;
  const [total, setTotal] = React.useState(errorTotal);

  const loadPage = React.useCallback(
    (page: number) => {
      if (!categoryId) {
        setLoading(false);
        modal.error({ title: "提示", content: "缺少错题知识点 ID" });
        return;
      }

      setLoading(true);
      setViewMode("question");
      setQuestionData(undefined);
      setSolutionData(undefined);
      setCurrentPage(page);
      vscode.postMessage({
        command: "getErrorPracticeQuestion",
        postData: {
          category,
          categoryId,
          page,
          limit: errorPageSize,
          total,
          fallbackQuestionIds,
        },
      });
    },
    [category, categoryId, errorPageSize, fallbackQuestionIds, modal, total],
  );

  React.useEffect(() => {
    loadPage(1);
  }, []);

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

  const onAnswerChange = (event: RadioChangeEvent, item: TQuestionItem) => {
    if (viewMode !== "question") return;

    const time = getAnswerTime();

    setQuestionData((prev) => {
      if (!prev?.questions) return prev;

      return {
        ...prev,
        questions: prev.questions.map((question) => {
          if (getQuestionKey(question) !== getQuestionKey(item)) return question;

          return {
            ...question,
            userAnswer: {
              type: 201,
              choice: String(event.target.value),
            },
          };
        }),
      };
    });

    vscode.postMessage({
      command: "answer",
      inc: Boolean(questionData?.combineKey),
      postData: {
        ...item,
        category,
        combineKey: questionData?.combineKey,
        exerciseId: questionData?.exerciseId,
        answer: event.target.value,
        time,
      },
    });
  };

  const onSubmit = () => {
    modal.confirm({
      title: "确认提交",
      onOk: () => {
        setLoading(true);
        vscode.postMessage({
          command: "getErrorPracticeSolution",
          postData: {
            category,
            categoryId,
            questionIds: currentQuestionIds,
            page: currentPage,
            limit: errorPageSize,
            total,
          },
        });
      },
    });
  };

  useVscodeMessage((message) => {
    setLoading(false);

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

    if (message.command === "errorPracticeQuestion") {
      const data = message.data as TQuestionData;
      const pagination = data.errorPagination || {};
      setQuestionData(data);
      setSolutionData(undefined);
      setViewMode("question");
      setCurrentQuestionIds(pagination.questionIds || []);
      setTotal(Number(pagination.total) || data.questionCount || 0);
      setCurrentPage(Number(pagination.page) || currentPage);
      answerTimerRef.current = Date.now();
    }

    if (message.command === "errorPracticeSolution") {
      const data = message.data as TSolutionData;
      const userAnswerMap = new Map(
        (questionData?.questions || []).map((item) => {
          return [getQuestionKey(item), item.userAnswer];
        }),
      );
      const solutionsWithUserAnswers = (data.solutions || []).map((item) => {
        const userAnswer = userAnswerMap.get(getQuestionKey(item));
        return userAnswer ? { ...item, userAnswer } : item;
      });
      const correctCount = solutionsWithUserAnswers.filter((item) => {
        return item.userAnswer?.choice === item.correctAnswer?.choice;
      }).length;

      setViewMode("solution");
      setSolutionData({
        ...data,
        solutions: solutionsWithUserAnswers,
        correctCount,
        questionCount: solutionsWithUserAnswers.length,
      });
    }
  });

  const questions = groupByMaterialIndexesTo2DArray(
    questionData?.questions || [],
  );
  const solutions = groupByMaterialIndexesTo2DArray(
    solutionData?.solutions || [],
  );
  const list = viewMode === "question" ? questions : solutions;
  const materials = questionData?.materials || solutionData?.materials || [];

  return (
    <div className="detail_page">
      <Spin tip="loading..." spinning={loading}>
        <div className="question-container">
          <div className="top-bar">
            <Button type="text" onClick={onBack}>
              返回上一页
            </Button>
            {viewMode === "question" && (
              <Button
                type="primary"
                style={{ borderColor: "white" }}
                onClick={onSubmit}
              >
                交卷
              </Button>
            )}
          </div>

          <div>{title}</div>
          {viewMode === "solution" && (
            <div>
              答对题目数：{solutionData?.correctCount} /{" "}
              {solutionData?.questionCount}
            </div>
          )}

          <div style={{ height: "10px" }}></div>

          <div>
            {list.map((item, index) => {
              return (
                <QuestionItem
                  key={`${viewMode}-${currentPage}-${index}`}
                  onChange={onAnswerChange}
                  data={item}
                  index={index}
                  materials={materials}
                  questionNumberOffset={(currentPage - 1) * errorPageSize}
                />
              );
            })}
          </div>

          {viewMode === "question" && (
            <Button
              type="primary"
              style={{ borderColor: "white" }}
              onClick={onSubmit}
            >
              交卷
            </Button>
          )}

          {total > errorPageSize && (
            <div className="error-practice-pagination">
              <Pagination
                size="small"
                current={currentPage}
                pageSize={errorPageSize}
                total={total}
                showSizeChanger={false}
                onChange={loadPage}
              />
            </div>
          )}

          <CanvasDrawing />
        </div>
      </Spin>

      {contextHolder}
    </div>
  );
};
