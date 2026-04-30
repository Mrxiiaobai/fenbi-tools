/* eslint-disable no-console */
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
  MaterialData,
  QuestionItem,
  QuestionPayload,
  SolutionItem,
  SolutionPayload,
  SydwmsEpisodeItem,
  SydwmsEpisodeMediaItem,
  SydwmsGiantPayload,
  SydwmsInterviewDetailPayload,
  SydwmsSolutionItem,
  SydwmsSolutionPayload,
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
  getSydwmsEpisodeMeta,
  getSydwmsEpisodes,
  getSydwmsGiants,
  getSydwmsNotes,
  getSydwmsSolutions,
  getUserTemplateInfo,
  incr,
  studyTime,
  submit,
  updateUserTemplateInfo,
} from "../utils/service";
import { getFenbiHlsPlayerUrl, getFenbiHlsProxyUrl } from "../utils/hlsProxy";
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

interface UpdateSettingsPostData {
  color?: string;
  backgroundColor?: string;
  needLineThrough?: boolean;
  fontSize?: number;
  canvasBrushColor?: string;
  canvasBrushWidth?: number;
}

interface SydwmsInterviewPostData {
  keypointId?: number | string;
  questionIndex?: number;
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

const flattenResponseItems = <TItem>(value: unknown): TItem[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.reduce<TItem[]>((list, item) => {
      return list.concat(flattenResponseItems<TItem>(item));
    }, []);
  }
  if (typeof value !== "object") return [];

  const record = value as Record<string, unknown>;
  const containerKeys = [
    "data",
    "datas",
    "questions",
    "questionList",
    "giants",
    "items",
    "list",
    "solutions",
    "episodes",
    "children",
  ];
  const nestedItems = containerKeys.reduce<TItem[]>((list, key) => {
    return key in record
      ? list.concat(flattenResponseItems<TItem>(record[key]))
      : list;
  }, []);
  if (nestedItems.length) return nestedItems;

  const itemKeys = [
    "globalId",
    "questionId",
    "content",
    "solution",
    "episodeId",
    "episode_id",
    "stem",
    "answer",
    "analysis",
    "parse",
    "media",
    "meta",
  ];
  if (itemKeys.some((key) => key in record)) {
    return [record as TItem];
  }

  return Object.keys(record).reduce<TItem[]>((list, key) => {
    return list.concat(flattenResponseItems<TItem>(record[key]));
  }, []);
};

const getSydwmsEpisodesByQuestionId = (
  payload: unknown,
  questionId: number | string,
) => {
  const data = payload && typeof payload === "object" && "data" in payload
    ? (payload as Record<string, unknown>).data
    : payload;
  if (!data || typeof data !== "object") return [];

  const value = (data as Record<string, unknown>)[String(questionId)];
  if (!value) return [];
  if (Array.isArray(value)) return value as SydwmsEpisodeItem[];
  if (typeof value !== "object") return [];

  return Object.keys(value as Record<string, unknown>).map((key) => {
    return (value as Record<string, unknown>)[key] as SydwmsEpisodeItem;
  });
};

const getEpisodeId = (item: SydwmsEpisodeItem) => {
  return item.episodeId || item.episode_id || item.id;
};

const getSydwmsEpisodeMedia = (meta: unknown) => {
  if (!meta || typeof meta !== "object") return meta;

  const record = meta as Record<string, unknown>;
  if (Array.isArray(record.datas)) return record.datas;
  if ("data" in record) return record.data;

  return meta;
};

const isHlsMedia = (media: SydwmsEpisodeMediaItem) => {
  return Number(media.format) === 3 || /m3u8/i.test(String(media.url || ""));
};

const attachPlayableMediaUrl = async (media: unknown): Promise<unknown> => {
  if (Array.isArray(media)) {
    return Promise.all(media.map((item) => attachPlayableMediaUrl(item)));
  }
  if (!media || typeof media !== "object") return media;

  const record = media as SydwmsEpisodeMediaItem;
  if (typeof record.url === "string" && record.url && isHlsMedia(record)) {
    console.log("[FenbiTools:Sydwms] create HLS playback url", {
      originalUrl: record.url,
      format: record.format,
      duration: record.duration,
      width: record.width,
      height: record.height,
    });
    const playbackUrl = await getFenbiHlsProxyUrl(record.url);
    const playerUrl = await getFenbiHlsPlayerUrl(record.url);
    console.log("[FenbiTools:Sydwms] HLS playback url created", {
      originalUrl: record.url,
      playbackUrl,
      playerUrl,
    });
    return {
      ...record,
      originalUrl: record.url,
      playbackUrl,
      playerUrl,
    };
  }

  return media;
};

const attachEpisodeMeta = async (episodes: SydwmsEpisodeItem[]) => {
  return Promise.all(
    episodes.map(async (item) => {
      const episodeId = getEpisodeId(item);
      if (!episodeId) return item;

      try {
        console.log("[FenbiTools:Sydwms] fetch episode meta", {
          episodeId,
          title: item.title || item.name,
        });
        const meta = await getSydwmsEpisodeMeta(episodeId);
        const media = await attachPlayableMediaUrl(getSydwmsEpisodeMedia(meta));
        console.log("[FenbiTools:Sydwms] episode meta attached", {
          episodeId,
          title: item.title || item.name,
          media,
        });
        return { ...item, media, meta };
      } catch (error) {
        console.error("[FenbiTools:Sydwms] episode meta failed", {
          episodeId,
          title: item.title || item.name,
          error: error instanceof Error ? error.message : String(error),
        });
        return item;
      }
    }),
  );
};

const extractSydwmsMaterials = (payload: unknown): Array<MaterialData | null> => {
  if (!payload || typeof payload !== "object") return [];

  const record = payload as Record<string, unknown>;
  if (Array.isArray(record.materials)) {
    return record.materials as Array<MaterialData | null>;
  }

  const nestedContainers = ["data", "datas", "solutions"];
  for (const key of nestedContainers) {
    const nested = record[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      const nestedMaterials = (nested as Record<string, unknown>).materials;
      if (Array.isArray(nestedMaterials)) {
        return nestedMaterials as Array<MaterialData | null>;
      }
    }
  }

  return [];
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
      case "getSydwmsInterviewDetail":
        await this.getSydwmsInterviewDetail(
          (postData || {}) as SydwmsInterviewPostData,
        );
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
      case "updateSettings":
        await this.updateSettings((postData || {}) as UpdateSettingsPostData);
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

  async getSydwmsInterviewDetail(params: SydwmsInterviewPostData) {
    if (!params.keypointId) {
      throw new Error("缺少面试题目 ID");
    }

    const giantsResult: SydwmsGiantPayload = await getSydwmsGiants(
      params.keypointId,
    );
    const questionCount = giantsResult.length;
    const requestedQuestionIndex = Math.floor(Number(params.questionIndex) || 0);
    const questionIndex = Math.min(
      Math.max(requestedQuestionIndex, 0),
      Math.max(questionCount - 1, 0),
    );
    const questionId = giantsResult[questionIndex];

    if (!questionId) {
      throw new Error("未获取到面试题内容");
    }

    const questionIds = [questionId];
    console.log("[FenbiTools:Sydwms] load interview detail", {
      keypointId: params.keypointId,
      questionId,
      questionIndex,
      questionCount,
    });
    const [solutionsResult, episodesResult, notesResult] = await Promise.all([
      getSydwmsSolutions(questionIds),
      getSydwmsEpisodes(questionIds),
      getSydwmsNotes(questionIds).catch(() => undefined),
    ]);

    const questions = flattenResponseItems<SydwmsSolutionItem>(
      solutionsResult as SydwmsSolutionPayload,
    );
    const materials = extractSydwmsMaterials(solutionsResult);
    const episodes = await attachEpisodeMeta(
      getSydwmsEpisodesByQuestionId(episodesResult, questionId),
    );

    console.log("[FenbiTools:Sydwms] interview detail loaded", {
      keypointId: params.keypointId,
      questionId,
      questionIndex,
      questionCount,
      loadedQuestionCount: questions.length,
      materialCount: materials.length,
      episodeCount: episodes.length,
      episodeTitles: episodes.map((item) => item.title || item.name),
    });

    const payload: SydwmsInterviewDetailPayload = {
      materials,
      questions,
      solutions: questions,
      episodes,
      notes: notesResult?.data || notesResult?.datas || notesResult?.notes,
      questionId,
      questionIndex,
      questionCount,
      questionIds: giantsResult,
    };

    webview.postMessage({
      command: "sydwmsInterviewDetail",
      data: payload,
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

    attachUserAnswers(
      questionResult.questions,
      exerciseResult.data?.userAnswers,
    );

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
    const isLocalHttp =
      url.scheme === "http" &&
      (url.authority.startsWith("127.0.0.1:") ||
        url.authority.startsWith("localhost:"));
    if (url.scheme !== "https" && !isLocalHttp) {
      throw new Error("只支持打开 https 链接或本地播放地址");
    }

    void vscode.env.openExternal(url);
  }

  private async updateSettings(params: UpdateSettingsPostData) {
    const config = vscode.workspace.getConfiguration("fenbiTools");
    const updates: Array<[keyof UpdateSettingsPostData, unknown]> = [
      ["color", params.color],
      ["backgroundColor", params.backgroundColor],
      ["needLineThrough", params.needLineThrough],
      ["fontSize", params.fontSize],
      ["canvasBrushColor", params.canvasBrushColor],
      ["canvasBrushWidth", params.canvasBrushWidth],
    ];

    await Promise.all(
      updates
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => {
          return config.update(key, value, vscode.ConfigurationTarget.Global);
        }),
    );

    webview.postMessage({
      command: "setting",
      data: vscode.workspace.getConfiguration("fenbiTools"),
    });
    webview.postMessage({
      command: "settingsUpdated",
      data: { message: "设置已保存" },
    });
  }
}
