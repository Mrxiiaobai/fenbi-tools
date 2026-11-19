import * as React from "react";
import { getObjectiveResultStats } from "../../shared/resultStats";
import { LeaderboardResultStatus } from "../components/leaderboard-result";
import "../style/leaderboard.less";
import { Button, Modal, Pagination, Spin } from "antd";
import { RadioChangeEvent } from "antd/es/radio";
import { useLocation, useNavigate } from "react-router-dom";
import { groupByMaterialIndexesTo2DArray } from "../utils/analyze";
import {
  TMaterials,
  TQuestionData,
  TQuestionItem,
  TSolutionData,
  TSolutionItem,
} from "../types";
import { QuestionItem } from "../components/question-item";
import CanvasDrawing from "../components/canvas-drawing";
import { getVscodeApi } from "../utils/vscodeApi";
import { SELECTENUM } from "../utils/constant";
import { useVscodeMessage } from "../hooks/useVscodeMessage";
import { formatStudyTime, useStudyTimer } from "../hooks/useStudyTimer";

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

const buildGroupMaterials = (
  group: Array<TQuestionItem | TSolutionItem>,
): TMaterials[] => {
  return group.map((q) => {
    const content = q.materialContent;
    if (content === undefined) return null;
    return content ? { content } : null;
  });
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
  const pausedAtRef = React.useRef<number | null>(null);
  const studyTimer = useStudyTimer();
  const [isPaused, setIsPaused] = React.useState(false);

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
    studyTimer.destroy();
    pausedAtRef.current = null;
    setIsPaused(false);
    navigate(-1);
  };

  const onPause = () => {
    if (!studyTimer.isRunning) return;
    pausedAtRef.current = Date.now();
    studyTimer.pause();
    setIsPaused(true);
  };

  const onResume = () => {
    const pausedAt = pausedAtRef.current;
    if (pausedAt === null) return;

    answerTimerRef.current += Date.now() - pausedAt;
    pausedAtRef.current = null;
    studyTimer.resume();
    setIsPaused(false);
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
        studyTimer.destroy();
        pausedAtRef.current = null;
        setIsPaused(false);
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
            leaderboardSubmissionId: questionData?.leaderboardSubmissionId,
            completedAt: new Date().toISOString(),
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
      studyTimer.start();
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
        return { ...item, userAnswer };
      });
      const { correctCount } = getObjectiveResultStats(solutionsWithUserAnswers);

      const correctQuestionIds = solutionsWithUserAnswers
        .filter((item) => getObjectiveResultStats([item]).correctCount === 1)
        .map((item) => getQuestionKey(item))
        .filter(Boolean);

      if (correctQuestionIds.length) {
        vscode.postMessage({
          command: "removeErrorQuestions",
          postData: {
            category,
            questionIds: correctQuestionIds,
          },
        });
      }

      studyTimer.destroy();
      pausedAtRef.current = null;
      setIsPaused(false);
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

  return (
    <div className="detail_page">
      <Spin tip="loading..." spinning={loading}>
        <div className="question-container">
          <div className="top-bar">
            <Button type="text" onClick={onBack}>
              返回上一页
            </Button>
            {studyTimer.isStarted && viewMode === "question" && (
              <Button
                className="study-timer-button"
                type="text"
                onClick={onPause}
                disabled={isPaused || loading}
                aria-label="暂停计时"
              >
                {formatStudyTime(studyTimer.elapsedSeconds)}
              </Button>
            )}
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
          {viewMode === "solution" && (
            <LeaderboardResultStatus key={solutionData?.leaderboardSubmissionId} data={solutionData} />
          )}

          <div style={{ height: "10px" }}></div>

          <div>
            {list.map((item, index) => {
              const groupMaterials = buildGroupMaterials(item);
              return (
                <QuestionItem
                  key={`${viewMode}-${currentPage}-${index}`}
                  onChange={onAnswerChange}
                  data={item}
                  index={index}
                  materials={groupMaterials}
                  disabled={isPaused}
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
                disabled={isPaused}
                showSizeChanger={false}
                onChange={loadPage}
              />
            </div>
          )}

          <CanvasDrawing shortcutsEnabled={!loading && !isPaused} />
        </div>
      </Spin>

      {contextHolder}
      <Modal
        open={isPaused}
        centered
        closable={false}
        maskClosable={false}
        keyboard={false}
        title="做题已暂停"
        footer={
          <Button type="primary" onClick={onResume}>
            继续做题
          </Button>
        }
      >
        <div>计时已暂停，继续后可以恢复答题。</div>
      </Modal>
    </div>
  );
};
