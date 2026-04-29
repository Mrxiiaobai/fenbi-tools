import * as vscode from "vscode";
import {
  getCategoryRouteConfig,
  getFavoriteQuizCourseSetPrefix,
  isEssayCategory,
  SELECTENUM,
} from "../shared/category";
import {
  ExerciseResult,
  FenbiAnswer,
  FavoriteQuizResponseData,
  HistoryExercise,
  QuestionItem,
  QuestionPayload,
  SolutionItem,
  SolutionPayload,
  UserAnswers,
  WebviewRequestMessage,
} from "../shared/types";
import {
  changeQuestionCount,
  courseSetChange,
  getCourseSetFavoriteQuiz,
  getCache,
  getCategories,
  getCurrent,
  getExercisesId,
  getExercisesUrl,
  getHistory,
  getQuestion,
  getQuickExercisesId,
  getSmartExercisesId,
  getSolution,
  getSolutionQuestion,
  getUserTemplateInfo,
  incr,
  studyTime,
  submit,
  updateUserTemplateInfo,
} from "../utils/service";
import { webview } from "../utils/webview";

interface HistoryPostData {
  category?: string;
  count?: number;
  categoryId?: number;
}

interface PageInitPostData {
  categoryId?: string;
}

interface ChangeCategoryPostData {
  categoryId?: string;
}

interface QuestionPostData {
  category?: string;
  combineKey?: string;
  id?: number;
}

interface SmartQuestionPostData extends QuestionPostData {
  yearScope?: number;
}

interface AnswerPostData {
  category?: string;
  combineKey?: string;
  globalId?: string | number;
  answer?: string | number;
  startTime?: number;
  exerciseId?: number;
}

interface SubmitPostData {
  category?: string;
  combineKey?: string;
}

interface JumpPostData {
  exerciseId?: number;
  category?: string;
}

interface ChangeQuestionCountPostData {
  questionCount?: number;
}

interface OpenInBrowserPostData {
  url?: string;
}

type QuestionLoadMode = "normal" | "quick" | "smart";

const getErrorMessage = (error: unknown) => {
  return error instanceof Error ? error.message : String(error);
};

const getStaticUrl = (result: ExerciseResult) => {
  return result.data?.staticUrl?.urls?.[0] || "";
};

const normalizeTemplateYearScope = (yearScope?: number) => {
  return [0, 5, 10].includes(Number(yearScope)) ? Number(yearScope) : 0;
};

const attachUserAnswers = <TItem extends QuestionItem | SolutionItem>(
  items: TItem[] | undefined,
  userAnswers?: UserAnswers,
) => {
  if (!items || !userAnswers) return;

  items.forEach((item) => {
    const answer = userAnswers[String(item.globalId)]?.answer;
    if (answer) {
      item.userAnswer = answer;
    }
  });
};

const countCorrectAnswers = (solutions: SolutionItem[] = []) => {
  return solutions.filter((item) => {
    return item.userAnswer?.choice === item.correctAnswer?.choice;
  }).length;
};

export default class WebviewHandle {
  onDidReceiveMessage() {
    return webview.onDidReceiveMessage((message) => {
      void this.handleMessage(message).catch((error) => {
        this.postError(error);
      });
    });
  }

  private async handleMessage(message: WebviewRequestMessage) {
    const { postData, command = "" } = message || {};

    switch (command) {
      case "pageInit":
        await this.pageInit((postData || {}) as PageInitPostData);
        return;
      case "changeCategory":
        await this.changeCategory((postData || {}) as ChangeCategoryPostData);
        return;
      case "getQuestion":
        await this.getQuestion((postData || {}) as QuestionPostData);
        return;
      case "getSolution":
        await this.getSolutions((postData || {}) as SubmitPostData);
        return;
      case "getQuickQuestion":
        await this.getQuickQuestion((postData || {}) as QuestionPostData);
        return;
      case "getSmartQuestion":
        await this.getSmartQuestion((postData || {}) as SmartQuestionPostData);
        return;
      case "getUserTemplateInfo":
        await this.getUserTemplateInfo();
        return;
      case "submit":
        await this.submit((postData || {}) as SubmitPostData);
        return;
      case "jumpFenbi":
        this.jump((postData || {}) as JumpPostData);
        return;
      case "changeQuestionCount":
        await this.changeQuestionCount(
          (postData || {}) as ChangeQuestionCountPostData,
        );
        return;
      case "answer":
        this.studyTime((postData || {}) as AnswerPostData);
        if (message.inc) {
          await this.inc((postData || {}) as AnswerPostData);
        }
        return;
      case "history":
        await this.getHistory((postData || {}) as HistoryPostData);
        return;
      case "openInBrowser":
        this.openInBrowser((postData || {}) as OpenInBrowserPostData);
        return;
      default:
        return;
    }
  }

  private postError(error: unknown) {
    webview.postMessage({
      command: "message",
      data: { message: getErrorMessage(error) || "操作失败" },
    });
  }

  async getHistory({
    category = SELECTENUM.XINGCE,
    count,
    categoryId,
  }: HistoryPostData = {}) {
    const config = getCategoryRouteConfig(category);
    const res = await getHistory({
      category: config.apiCategory,
      count: count || 15,
      categoryId: categoryId || undefined,
    });

    webview.postMessage({
      command: "history",
      data: res.datas || ([] as HistoryExercise[]),
    });
  }

  async pageInit(postData: PageInitPostData) {
    const category = postData.categoryId || SELECTENUM.XINGCE;
    const config = getCategoryRouteConfig(category);
    const cacheResult = await getCache(config.apiCategory);
    const menu = await getCategories(category);
    const favoriteQuizLocationName =
      await this.getFavoriteQuizLocationName(category);

    const settingConfig = vscode.workspace.getConfiguration("fenbiTools");

    webview.postMessage({
      command: "setting",
      data: settingConfig,
    });

    webview.postMessage({
      command: "init",
      data: {
        categoryId: category,
        favoriteQuizLocationName,
        menu,
        cacheResult: cacheResult || {},
      },
    });

    webview.postMessage({
      command: "pageCache",
      data: cacheResult,
    });
  }

  async changeCategory(postData: ChangeCategoryPostData) {
    const category = postData.categoryId || SELECTENUM.XINGCE;
    const config = getCategoryRouteConfig(category);
    await courseSetChange({ category: config.courseSetPrefix });
  }

  async getFavoriteQuizLocationName(category?: string) {
    const courseSetPrefix = getFavoriteQuizCourseSetPrefix(category);
    try {
      const res = await getCourseSetFavoriteQuiz({ courseSetPrefix });
      const favoriteQuizData: FavoriteQuizResponseData = res.data || {
        currentQuizVO: res.currentQuizVO,
        favoriteQuizVO: res.favoriteQuizVO,
      };
      const currentQuizId = favoriteQuizData.currentQuizVO?.quizId;
      return (
        favoriteQuizData.favoriteQuizVO?.find((item) => {
          return item.id === currentQuizId;
        })?.name || ""
      );
    } catch (_error) {
      return "";
    }
  }

  async getQuestion(params: QuestionPostData) {
    await this.loadQuestion(params, "normal");
  }

  async getQuickQuestion(params: QuestionPostData) {
    await this.loadQuestion(params, "quick");
  }

  async getSmartQuestion(params: SmartQuestionPostData) {
    const yearScope = normalizeTemplateYearScope(params.yearScope);
    await updateUserTemplateInfo({ yearScope });
    await this.loadQuestion({ ...params, yearScope }, "smart");
  }

  async getUserTemplateInfo() {
    const res = await getUserTemplateInfo();
    webview.postMessage({
      command: "templateInfo",
      data: res.data || {},
    });
  }

  private async loadQuestion(
    params: QuestionPostData & { yearScope?: number },
    mode: QuestionLoadMode,
  ) {
    const category = params.category || SELECTENUM.XINGCE;
    let combineKey = params.combineKey || "";

    if (!combineKey) {
      const keyResult =
        mode === "smart"
          ? await getSmartExercisesId(category, { yearScope: params.yearScope })
          : mode === "quick"
            ? await getQuickExercisesId(category)
            : await getExercisesId(category, { keypointId: params.id });
      combineKey = keyResult.key || "";
    }

    if (!combineKey) {
      throw new Error("获取练习 key 失败");
    }

    const exerciseResult = await getExercisesUrl({
      category,
      combineKey,
    });

    if (exerciseResult.code === -1) {
      throw new Error(exerciseResult.message || "获取试题失败");
    }

    const staticUrl = getStaticUrl(exerciseResult);
    if (!staticUrl) {
      throw new Error("获取试题地址失败");
    }

    const questionResult = await getQuestion(category, staticUrl);
    void getCurrent().catch(() => undefined);

    attachUserAnswers(questionResult.questions, exerciseResult.data?.userAnswers);

    const payload: QuestionPayload = {
      ...questionResult,
      exerciseId: exerciseResult.data?.ancientExerciseId?.id,
      combineKey,
      combinKey: combineKey,
    };

    webview.postMessage({
      command: "getQuestion",
      data: payload,
    });
  }

  studyTime(params: AnswerPostData) {
    if (!params.exerciseId) return;

    const config = getCategoryRouteConfig(params.category);
    void studyTime({
      exerciseId: params.exerciseId,
      questionId: 0,
      startTime: Date.now(),
      studyTime: 30000,
      subType: 1,
      tikuPrefix: config.tikuPrefix,
    }).catch(() => undefined);
  }

  async inc(params: AnswerPostData) {
    if (!params.category || !params.combineKey || !params.globalId) {
      throw new Error("答题参数缺失");
    }

    const answer: FenbiAnswer = isEssayCategory(params.category)
      ? {
          type: 204,
          answer: String(params.answer || ""),
        }
      : {
          type: 201,
          choice: String(params.answer),
        };

    await incr(params.category, params.combineKey, {
      answer,
      key: String(params.globalId),
      time: Math.floor((Date.now() - (params.startTime || Date.now())) / 1000),
    });
  }

  async submit(params: SubmitPostData) {
    const category = params.category || SELECTENUM.XINGCE;
    if (!params.combineKey) {
      throw new Error("缺少练习 key，无法交卷");
    }

    const submitRes = await submit(category, params.combineKey);
    if (submitRes.msg === "needPayment") {
      webview.postMessage({
        command: "message",
        data: {
          message:
            "需要自行前往粉笔官网开通vip，与本插件无关，由于无VIP，申论后续功能暂无",
        },
      });
      return;
    }

    const solutionRes = await this.loadSolution(category, params.combineKey);
    webview.postMessage({
      command: "solution",
      data: solutionRes,
    });
  }

  async getSolutions(postData: SubmitPostData) {
    const category = postData.category || SELECTENUM.XINGCE;
    if (!postData.combineKey) {
      throw new Error("缺少练习 key，无法获取解析");
    }

    const solutionRes = await this.loadSolution(category, postData.combineKey);
    webview.postMessage({
      command: "solution",
      data: solutionRes,
    });
  }

  private async loadSolution(category: string, combineKey: string) {
    const res = await getSolution(category, combineKey);
    const staticUrl = getStaticUrl(res);
    if (!staticUrl) {
      throw new Error("获取解析地址失败");
    }

    const solutionRes: SolutionPayload = await getSolutionQuestion(
      staticUrl,
      category,
    );

    attachUserAnswers(solutionRes.solutions, res.data?.userAnswers);
    solutionRes.correctCount = countCorrectAnswers(solutionRes.solutions);
    solutionRes.questionCount = solutionRes.solutions?.length || 0;

    return solutionRes;
  }

  jump(params: JumpPostData) {
    if (!params.exerciseId) {
      throw new Error("缺少练习 ID，无法打开粉笔页面");
    }

    const category = params.category || SELECTENUM.XINGCE;
    const url = vscode.Uri.parse(
      `https://www.fenbi.com/spa/tiku/report/exam/solution/${category}/${category}/${params.exerciseId}/2`,
    );
    void vscode.env.openExternal(url);
  }

  async changeQuestionCount(params: ChangeQuestionCountPostData) {
    if (!params.questionCount) {
      throw new Error("请选择每组出题数量");
    }

    await changeQuestionCount({ questionCount: params.questionCount });

    webview.postMessage({
      command: "message",
      data: { message: "修改成功" },
    });
  }

  private openInBrowser(params: OpenInBrowserPostData) {
    if (!params.url) {
      throw new Error("缺少打开链接");
    }

    const url = vscode.Uri.parse(params.url);
    if (url.scheme !== "https") {
      throw new Error("只支持打开 https 链接");
    }

    void vscode.env.openExternal(url);
  }
}
