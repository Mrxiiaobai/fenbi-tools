/* eslint-disable no-console */
import * as vscode from "vscode";
import {
  getCategoryRouteConfig,
  getFavoriteQuizCourseSetPrefix,
  isEssayCategory,
  isInterviewCategory,
  SELECTENUM,
} from "../shared/category";
import {
  ErrorKeypointTreeResponse,
  ErrorQuestionIdsResponse,
  ErrorPracticePagination,
  ErrorSolutionsResponse,
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
  getErrorKeypointTree,
  getErrorQuestionIds,
  getErrorSolutions,
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

interface ErrorKeypointTreePostData {
  category?: string;
}

interface ErrorPracticePostData {
  category?: string;
  categoryId?: number | string;
  questionIds?: Array<number | string>;
  fallbackQuestionIds?: Array<number | string>;
  page?: number;
  limit?: number;
  total?: number;
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
  id?: string | number;
  globalId?: string | number;
  answer?: string | number;
  startTime?: number;
  time?: number;
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
  category?: string;
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

const dedupeIds = (ids: Array<number | string> = []) => {
  return Array.from(
    new Set(ids.map((id) => String(id || "").trim()).filter(Boolean)),
  );
};

const chunkIds = (ids: string[], size = 100) => {
  const chunks: string[][] = [];
  for (let index = 0; index < ids.length; index += size) {
    chunks.push(ids.slice(index, index + size));
  }
  return chunks;
};

const normalizeErrorPracticePage = (page?: number) => {
  return Math.max(1, Math.floor(Number(page) || 1));
};

const normalizeErrorPracticeLimit = (limit?: number) => {
  return Math.max(1, Math.min(100, Math.floor(Number(limit) || 10)));
};

const normalizeAnswerTime = (params: AnswerPostData) => {
  const explicitTime = Number(params.time);
  if (Number.isFinite(explicitTime) && explicitTime >= 0) {
    return Math.floor(explicitTime);
  }

  return Math.floor((Date.now() - (params.startTime || Date.now())) / 1000);
};

const getAnswerQuestionId = (params: AnswerPostData) => {
  return Number(params.globalId || params.id || 0);
};

const flattenQuestionIds = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.reduce<string[]>((ids, item) => {
      return ids.concat(flattenQuestionIds(item));
    }, []);
  }

  if (typeof value === "number") {
    return [String(value)];
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
  }

  if (!value || typeof value !== "object") return [];

  const record = value as Record<string, unknown>;
  const candidateKeys = [
    "questionIds",
    "ids",
    "globalIds",
    "questionId",
    "question_id",
    "globalId",
    "global_id",
    "id",
    "records",
    "rows",
    "items",
    "list",
    "result",
    "values",
    "questions",
    "data",
    "datas",
  ];

  return candidateKeys.reduce<string[]>((ids, key) => {
    return key in record ? ids.concat(flattenQuestionIds(record[key])) : ids;
  }, []);
};

const extractErrorQuestionTotal = (value: unknown): number | undefined => {
  if (!value || typeof value !== "object") return undefined;

  const record = value as Record<string, unknown>;
  const directTotal = ["total", "totalCount", "count"].find((key) => {
    return typeof record[key] === "number";
  });
  if (directTotal) return Number(record[directTotal]);

  const nestedKeys = ["data", "datas", "pagination", "page"];
  for (const key of nestedKeys) {
    const total = extractErrorQuestionTotal(record[key]);
    if (total !== undefined) return total;
  }

  return undefined;
};

const normalizeErrorQuestionIdsResponse = (
  payload: ErrorQuestionIdsResponse,
) => {
  const questionIds = dedupeIds(flattenQuestionIds(payload));
  const total = extractErrorQuestionTotal(payload) ?? questionIds.length;

  return {
    questionIds,
    total,
  };
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

const getQuestionIdentity = (item: QuestionItem | SolutionItem) => {
  const record = item as QuestionItem & {
    questionId?: number | string;
    idStr?: number | string;
  };

  return String(
    record.id || record.globalId || record.questionId || record.idStr || "",
  );
};

const sortItemsByQuestionIds = <TItem extends QuestionItem | SolutionItem>(
  items: TItem[],
  questionIds: string[],
) => {
  const orderMap = new Map(questionIds.map((id, index) => [id, index]));

  return items.slice().sort((left, right) => {
    const leftOrder = orderMap.get(getQuestionIdentity(left));
    const rightOrder = orderMap.get(getQuestionIdentity(right));

    if (leftOrder === undefined && rightOrder === undefined) return 0;
    if (leftOrder === undefined) return 1;
    if (rightOrder === undefined) return -1;
    return leftOrder - rightOrder;
  });
};

const stripSolution = (item: SolutionItem): QuestionItem => {
  const { solution: _solution, ...question } = item;
  return question;
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
  const data =
    payload && typeof payload === "object" && "data" in payload
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

const extractSydwmsMaterials = (
  payload: unknown,
): Array<MaterialData | null> => {
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

const extractErrorMaterials = (
  payloads: ErrorSolutionsResponse[],
): Array<MaterialData | null> => {
  return payloads.reduce<Array<MaterialData | null>>((materials, payload) => {
    if (!payload || Array.isArray(payload) || typeof payload !== "object") {
      return materials;
    }

    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.materials)) {
      return materials.concat(record.materials as Array<MaterialData | null>);
    }

    return materials;
  }, []);
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
      case "getErrorKeypointTree":
        await this.getErrorKeypointTree(
          (postData || {}) as ErrorKeypointTreePostData,
        );
        return;
      case "getErrorPracticeQuestion":
        await this.getErrorPracticeQuestion(
          (postData || {}) as ErrorPracticePostData,
        );
        return;
      case "getErrorPracticeSolution":
        await this.getErrorPracticeSolution(
          (postData || {}) as ErrorPracticePostData,
        );
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
    void vscode.window.showErrorMessage(getErrorMessage(error) || "操作失败");
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

  async getErrorKeypointTree(params: ErrorKeypointTreePostData) {
    const category = params.category || SELECTENUM.XINGCE;
    const tree: ErrorKeypointTreeResponse =
      await getErrorKeypointTree(category);

    webview.postMessage({
      command: "errorKeypointTree",
      data: tree || [],
    });
  }

  private async loadErrorPracticePage(params: ErrorPracticePostData) {
    const category = params.category || SELECTENUM.XINGCE;
    const page = normalizeErrorPracticePage(params.page);
    const limit = normalizeErrorPracticeLimit(params.limit);
    const offset = (page - 1) * limit;
    let questionIds = dedupeIds(params.questionIds || []);
    const fallbackQuestionIds = dedupeIds(params.fallbackQuestionIds || []);
    const fallbackPageQuestionIds = fallbackQuestionIds.slice(
      offset,
      offset + limit,
    );
    let total =
      Number(params.total) || fallbackQuestionIds.length || questionIds.length;

    if (!questionIds.length && fallbackPageQuestionIds.length) {
      questionIds = fallbackPageQuestionIds;
    }

    if (!questionIds.length) {
      if (!params.categoryId) {
        throw new Error("缺少错题知识点 ID，无法开始练习");
      }

      const questionIdsResult = await getErrorQuestionIds(category, {
        categoryId: params.categoryId,
        offset,
        limit,
      });
      const normalized = normalizeErrorQuestionIdsResponse(questionIdsResult);
      questionIds = normalized.questionIds;
      total = total || normalized.total;

      if (questionIds.length > limit) {
        total = Math.max(total, questionIds.length);
        questionIds = questionIds.slice(offset, offset + limit);
      }
    }

    if (!questionIds.length) {
      questionIds = fallbackPageQuestionIds;
    }

    if (!questionIds.length) {
      throw new Error("当前页暂无错题");
    }

    const payloads = await Promise.all(
      chunkIds(questionIds).map((ids) => getErrorSolutions(category, ids)),
    );
    const solutions = sortItemsByQuestionIds(
      payloads.reduce<SolutionItem[]>((items, payload) => {
        return items.concat(flattenResponseItems<SolutionItem>(payload));
      }, []),
      questionIds,
    );

    return {
      pagination: {
        categoryId: params.categoryId,
        page,
        limit,
        total,
        questionIds,
      } as ErrorPracticePagination,
      questionIds,
      solutions,
      materials: extractErrorMaterials(payloads),
    };
  }

  async getErrorPracticeQuestion(params: ErrorPracticePostData) {
    const { pagination, questionIds, solutions, materials } =
      await this.loadErrorPracticePage(params);

    webview.postMessage({
      command: "errorPracticeQuestion",
      data: {
        questions: solutions.map(stripSolution),
        materials,
        questionCount: pagination.total || questionIds.length,
        errorPagination: pagination,
      } as QuestionPayload,
    });
  }

  async getErrorPracticeSolution(params: ErrorPracticePostData) {
    const { pagination, questionIds, solutions, materials } =
      await this.loadErrorPracticePage(params);

    webview.postMessage({
      command: "errorPracticeSolution",
      data: {
        solutions,
        materials,
        questionCount: pagination.total || questionIds.length,
        correctCount: 0,
        errorPagination: pagination,
      } as SolutionPayload,
    });
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

    const requestedCategory = params.category || SELECTENUM.SYDWMS;
    const category = isInterviewCategory(requestedCategory)
      ? requestedCategory
      : SELECTENUM.SYDWMS;
    const giantsResult: SydwmsGiantPayload = await getSydwmsGiants(
      params.keypointId,
      category,
    );
    const questionCount = giantsResult.length;
    const requestedQuestionIndex = Math.floor(
      Number(params.questionIndex) || 0,
    );
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
      category,
      keypointId: params.keypointId,
      questionId,
      questionIndex,
      questionCount,
    });
    const [solutionsResult, episodesResult, notesResult] = await Promise.all([
      getSydwmsSolutions(questionIds, category),
      getSydwmsEpisodes(questionIds, category),
      getSydwmsNotes(questionIds, category).catch(() => undefined),
    ]);

    const questions = flattenResponseItems<SydwmsSolutionItem>(
      solutionsResult as SydwmsSolutionPayload,
    );
    const materials = extractSydwmsMaterials(solutionsResult);
    const episodes = await attachEpisodeMeta(
      getSydwmsEpisodesByQuestionId(episodesResult, questionId),
    );

    console.log("[FenbiTools:Sydwms] interview detail loaded", {
      category,
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
      category,
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
    const exerciseId = Number(params.exerciseId || 0);
    const questionId = getAnswerQuestionId(params);
    if (!exerciseId && !questionId) return;

    const config = getCategoryRouteConfig(params.category);
    const answerTime = normalizeAnswerTime(params);
    const studyTimeMs = Math.max(0, answerTime * 1000);
    void studyTime({
      exerciseId,
      questionId,
      startTime: Date.now() - studyTimeMs,
      studyTime: studyTimeMs,
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
      time: normalizeAnswerTime(params),
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
    // https://spa.fenbi.com/ti/exam/solution/1_1_3loi47o?routecs=xingce
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
