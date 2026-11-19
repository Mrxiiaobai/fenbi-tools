import * as React from "react";
import { LeaderboardResultStatus } from "../components/leaderboard-result";
import "../style/leaderboard.less";
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
import { formatStudyTime, useStudyTimer } from "../hooks/useStudyTimer";

const vscode = getVscodeApi();
let modalIs = false;

interface DetailLocationState {
  id?: number;
  paperId?: number | string;
  paperTitle?: string;
  type?: number;
  combineKey?: string;
  mode?: "quick" | "smart" | "real";
  smartYearScope?: number;
}

export const Detail = () => {
  const [modal, contextHolder] = Modal.useModal();
  const [isFirst, setFirst] = React.useState(false);
  const [startTime, setStartTime] = React.useState(0);
  const answerTimerRef = React.useRef(Date.now());
  const pausedAtRef = React.useRef<number | null>(null);
  const studyTimer = useStudyTimer();
  const [isPaused, setIsPaused] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const [page, setPage] = React.useState<number>(1);
  const [questionData, setQuestionData] = React.useState<TQuestionData>();
  const [solutionData, setSolutionData] = React.useState<TSolutionData>();
  const { setting } = useSetting();

  const navigate = useNavigate();
  const location = useLocation();
  const {
    id,
    paperId,
    paperTitle,
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
      paperId,
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
      studyTimer.start();
    }
  }, [questionData?.questions, isFirst, studyTimer.start]);

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
    paperId,
    combineKey,
    type = 1,
    mode,
    smartYearScope,
  }: {
    category?: string;
    id?: number;
    paperId?: number | string;
    combineKey?: string | null;
    type?: number;
    mode?: "quick" | "smart" | "real";
    smartYearScope?: number;
  }) => {
    setLoading(true);
    if (mode === "real") {
      vscode.postMessage({
        command: "getRealQuestion",
        postData: { category, paperId },
      });
      return;
    }
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
        studyTimer.destroy();
        pausedAtRef.current = null;
        setIsPaused(false);
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
      studyTimer.destroy();
      pausedAtRef.current = null;
      setIsPaused(false);
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
            {studyTimer.isStarted && page === 1 && (
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
          {mode === "real" && paperTitle && (
            <div className="paper-answer-title">{paperTitle}</div>
          )}
          {page == 2 && (
            <div>
              答对题目数：{solutionData?.correctCount} /{" "}
              {solutionData?.questionCount}{" "}
            </div>
          )}
          {page === 2 && (
            <LeaderboardResultStatus key={solutionData?.leaderboardSubmissionId} data={solutionData} />
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
                    disabled={isPaused}
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
                  disabled={isPaused}
                />
              );
            })}
          </div>

          <CanvasDrawing shortcutsEnabled={!loading && !isPaused} />

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
