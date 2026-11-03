import {
  SELECTENUM,
  isEssayCategory,
  isInterviewCategory,
} from "../shared/category";
import { buildMaterialsForQuestions } from "../shared/materials";
import {
  CacheData,
  CategoryNode,
  ErrorKeypointTreeResponse,
  ErrorQuestionIdsResponse,
  ErrorSolutionsResponse,
  ExerciseKeyResponse,
  ExerciseResult,
  FavoriteQuizResponse,
  HistoryResponse,
  MaterialData,
  PaperCatalogPayload,
  PaperLabel,
  QuestionCard,
  QuestionPayload,
  SolutionPayload,
  SydwmsEpisodeMetaPayload,
  SydwmsEpisodePayload,
  SydwmsGiantPayload,
  SydwmsNotePayload,
  SydwmsSolutionPayload,
  UserQuestionInfoResponse,
  UserTemplateInfoResponse,
} from "../shared/types";
import ajax from "./request";

const WEB_API_QUERY = "app=web&kav=100&av=121&hav=100&version=3.0.0.0";
const CURRENT_WEB_API_QUERY = "app=web&kav=125&av=127&hav=125&version=3.0.0.0";
const SYDWMS_API_QUERY = "kav=100&av=100&hav=100&app=web";

export const getExercisesId = async (
  category: string = "xingce",
  params: {
    keypointId?: number;
  },
) => {
  const userInfo = await getUserQuestionInfo();
  const { questionCount, yearScope, correctRatioLow, correctRatioHigh } =
    userInfo.data || {};

  const url = `https://tiku.fenbi.com/api/${
    category || "xingce"
  }/exercises?${WEB_API_QUERY}`;

  let limit = questionCount || 15;
  if (isEssayCategory(category)) {
    limit = 1;
  }

  const res = await ajax<ExerciseKeyResponse>(
    "FORM",
    url,
    {
      type: 3,
      keypointId: params.keypointId,
      limit: limit,
      exerciseTimeMode: 2,
      yearScope: yearScope,
      correctRatioLow: correctRatioLow,
      correctRatioHigh: correctRatioHigh,
    },
    {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
  );

  return res;
};

export const getQuickExercisesId = async (category: string = "xingce") => {
  const url = `https://tiku.fenbi.com/api/${
    category || "xingce"
  }/exercises?${WEB_API_QUERY}`;

  const res = await ajax<ExerciseKeyResponse>(
    "FORM",
    url,
    {
      type: 3,
      exerciseTimeMode: 2,
    },
    {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
  );

  return res;
};

export const getSmartExercisesId = async (
  category: string = "xingce",
  params: {
    yearScope?: number;
  } = {},
) => {
  const url = `https://tiku.fenbi.com/api/${
    category || "xingce"
  }/exercises?${CURRENT_WEB_API_QUERY}`;

  const res = await ajax<ExerciseKeyResponse>(
    "FORM",
    url,
    {
      type: 2,
      exerciseTimeMode: 2,
      yearScope: params.yearScope ?? 0,
    },
    {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
  );

  return res;
};

export const getRealExercisesId = async (
  category: string = "xingce",
  paperId: number | string,
) => {
  const url = `https://tiku.fenbi.com/api/${
    category || "xingce"
  }/exercises?${WEB_API_QUERY}`;

  return ajax<ExerciseKeyResponse>(
    "FORM",
    url,
    {
      type: 1,
      paperId,
      exerciseTimeMode: 2,
    },
    {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
  );
};

export const getPaperLabels = async (category: string = "xingce") => {
  const baseUrl = `https://tiku.fenbi.com/api/${category || "xingce"}`;
  try {
    return await ajax<PaperLabel[]>(
      "GET",
      `${baseUrl}/subLabels?${CURRENT_WEB_API_QUERY}`,
    );
  } catch (_error) {
    return ajax<PaperLabel[]>(
      "GET",
      `${baseUrl}/subLabels/v2?${CURRENT_WEB_API_QUERY}`,
    );
  }
};

export const getPastPapers = async (
  category: string = "xingce",
  params: { page?: number; pageSize?: number; labelId?: number | string } = {},
) => {
  const page = Math.max(0, Math.floor(Number(params.page) || 0));
  const pageSize = Math.max(
    1,
    Math.min(50, Math.floor(Number(params.pageSize) || 12)),
  );
  const query = new URLSearchParams({
    toPage: String(page),
    pageSize: String(pageSize),
  });
  if (params.labelId !== undefined && params.labelId !== "") {
    query.set("labelId", String(params.labelId));
  }

  const baseUrl = `https://tiku.fenbi.com/api/${category || "xingce"}`;
  try {
    return await ajax<PaperCatalogPayload>(
      "GET",
      `${baseUrl}/papers/?${query.toString()}`,
    );
  } catch (_error) {
    return ajax<PaperCatalogPayload>(
      "GET",
      `${baseUrl}/papers/v2?${query.toString()}`,
    );
  }
};

export const getExercisesUrl = async ({
  category = "xingce",
  combineKey,
}: {
  category?: string;
  combineKey: string;
}) => {
  const url = `https://tiku.fenbi.com/combine/exercise/getExercise?format=html&key=${combineKey}&routecs=${category}&kav=121&av=121&hav=121&app=web`;
  const res = await ajax<ExerciseResult>("GET", url);
  return res;
};

type QuestionApiResponse = Omit<QuestionPayload, "materials"> & {
  card?: QuestionCard;
  materials?: MaterialData[];
};

type SolutionQuestionApiResponse = SolutionPayload & {
  card?: QuestionCard;
  materials?: MaterialData[];
};

export const getQuestion = async (
  category: string,
  url: string,
  _type: number = 1,
) => {
  const _url = `${url}&routecs=${category}&type=1&kav=121&av=121&hav=121&app=web`;
  const res = await ajax<QuestionApiResponse>("GET", _url);
  return {
    ...res,
    materials: buildMaterialsForQuestions(res.card, res.materials),
  };
};

export const getCategories = async (category: string) => {
  let url = `https://tiku.fenbi.com/api/${category}/categories?&filter=keypoint&app=web&kav=100&av=121&hav=100&version=3.0.0.0`;
  if (category === "shenlun") {
    url =
      "https://tiku.fenbi.com/api/shenlun/pdpg/categories?app=web&kav=100&av=121&hav=100&version=3.0.0.0";
  }
  if (category === "zhyynl") {
    url =
      "https://tiku.fenbi.com/api/zhyynl/etRuleQuestion/categories?app=web&kav=100&av=121&hav=100&version=3.0.0.0";
  }
  if (isInterviewCategory(category)) {
    url = `https://tiku.fenbi.com/api/${category}/categories?&filter=giant&app=web&kav=125&av=127&hav=125&version=3.0.0.0`;
  }
  const res = await ajax<CategoryNode[]>("GET", url);
  return res;
};

export const getErrorKeypointTree = async (
  category: string = SELECTENUM.XINGCE,
) => {
  const url = `https://tiku.fenbi.com/api/${category}/errors/keypoint-tree?timeRange=0&order=desc&${CURRENT_WEB_API_QUERY}`;
  const res = await ajax<ErrorKeypointTreeResponse>("GET", url);
  return res;
};

export const getErrorQuestionIds = async (
  category: string = SELECTENUM.XINGCE,
  params: {
    categoryId: number | string;
    offset: number;
    limit: number;
  },
) => {
  const url = `https://tiku.fenbi.com/api/${category}/questionIds?type=errors&categoryId=${params.categoryId}&offset=${params.offset}&limit=${params.limit}&order=desc&timeRange=0&${CURRENT_WEB_API_QUERY}`;
  const res = await ajax<ErrorQuestionIdsResponse>("GET", url);
  return res;
};

export const getErrorSolutions = async (
  category: string = SELECTENUM.XINGCE,
  questionIds: Array<number | string>,
) => {
  const ids = questionIds.join(",");
  const url = `https://tiku.fenbi.com/api/${category}/universal/auth/solutions?type=1&questionIds=${ids}&${CURRENT_WEB_API_QUERY}`;
  const res = await ajax<ErrorSolutionsResponse>("GET", url);
  return res;
};

export const removeErrorQuestion = async (
  category: string = SELECTENUM.XINGCE,
  questionId: number | string,
) => {
  const url = `https://tiku.fenbi.com/api/${category}/errors/${questionId}?${CURRENT_WEB_API_QUERY}`;
  const res = await ajax("DELETE", url);
  console.log("removeErrorQuestion res:", res);
  return res;
};

export const getSydwmsGiants = async (
  keypointId: number | string,
  category: string = SELECTENUM.SYDWMS,
) => {
  const url = `https://tiku.fenbi.com/api/${category}/giants?keypointId=${keypointId}&${SYDWMS_API_QUERY}`;
  const res = await ajax<SydwmsGiantPayload>("GET", url);
  return res;
};

export const getSydwmsSolutions = async (
  questionIds: Array<number | string>,
  category: string = SELECTENUM.SYDWMS,
) => {
  const ids = questionIds.join(",");
  const url = `https://tiku.fenbi.com/api/${category}/universal/auth/solutions?type=9&questionIds=${ids}&${SYDWMS_API_QUERY}`;
  const res = await ajax<SydwmsSolutionPayload>("GET", url);
  return res;
};

export const getSydwmsEpisodes = async (
  questionIds: Array<number | string>,
  category: string = SELECTENUM.SYDWMS,
) => {
  const ids = questionIds.join(",");
  const url = `https://ke.fenbi.com/api/gwy/v3/episodes/tiku_episodes_with_multi_type?tiku_ids=${ids}&tiku_prefix=${category}&tiku_type=5&${SYDWMS_API_QUERY}`;
  const res = await ajax<SydwmsEpisodePayload>("GET", url);
  return res;
};

export const getSydwmsEpisodeMeta = async (episodeId: number | string) => {
  const url = `https://ke.fenbi.com/api/gwy/v3/episodes/${episodeId}/mediafile/meta?content_id=0&biz_type=100&${SYDWMS_API_QUERY}`;
  const res = await ajax<SydwmsEpisodeMetaPayload>("GET", url);
  return res;
};

export const getSydwmsNotes = async (
  questionIds: Array<number | string>,
  category: string = SELECTENUM.SYDWMS,
) => {
  const ids = questionIds.join(",");
  const url = `https://tiku.fenbi.com/api/${category}/notes?questionIds=${ids}&${SYDWMS_API_QUERY}`;
  const res = await ajax<SydwmsNotePayload>("GET", url);
  return res;
};

export const getSolution = async (category = "xingce", combineKey: string) => {
  const url = `https://tiku.fenbi.com/combine/exercise/getSolution?format=html&key=${combineKey}&routecs=${category}&kav=121&av=121&hav=121&app=web`;
  const res = await ajax<ExerciseResult>("GET", url);
  return res;
};

export const getSolutionQuestion = async (url: string, category = "xingce") => {
  const _url = `${url}&routecs=${category}&type=1&kav=121&av=121&hav=121&app=web`;
  const res = await ajax<SolutionQuestionApiResponse>("GET", _url);
  return {
    ...res,
    materials: buildMaterialsForQuestions(res.card, res.materials || []),
  };
};

export const getCache = async (catrgory: string = "xingce") => {
  const url = `https://tiku.fenbi.com/api/${catrgory}/category-exercises-unfinished?noCacheTag=${Math.round(
    1e3 * Math.random(),
  )}&app=web&kav=100&av=121&hav=100&version=3.0.0.0`;
  const res = await ajax<CacheData>("GET", url);
  return res;
};

export const studyTime = async (params: {
  exerciseId: number;
  questionId: number;
  startTime: number;
  studyTime: number;
  subType: number;
  tikuPrefix: string;
}) => {
  const url = `
https://tiku.fenbi.com/activity/report/studyTime?app=web&kav=121&av=121&hav=121&version=3.0.0.0`;
  const res = await ajax("POST", url, [params]);
  return res;
};

export const getHistory = async ({
  category = "xingce",
  count = 15,
  categoryId,
}: {
  category?: string;
  count?: number;
  categoryId?: number;
}) => {
  const url = `https://tiku.fenbi.com/api/${category}/category-exercises?categoryId=${categoryId}&cursor=0&count=${count}&noCacheTag=${Math.round(
    1e3 * Math.random(),
  )}&app=web&kav=100&av=121&hav=100&version=3.0.0.0`;
  const res = await ajax<HistoryResponse>("GET", url);
  return res;
};

export const incr = async (
  category: string = "xingce",
  combineKey: string,
  params: {
    answer: { type: number; choice?: string; answer?: string };
    key: string;
    time: number;
  },
) => {
  const url = `https://tiku.fenbi.com/combine/exercise/incrUpdate?key=${combineKey}&routecs=${category}&kav=121&av=121&hav=121&app=web`;
  const res = await ajax("POST", url, [params]);
  return res;
};

export const submit = async (category = "xingce", combineKey: string) => {
  const url = `https://tiku.fenbi.com/combine/exercise/submit?key=${combineKey}&routecs=${category}&kav=121&av=121&hav=121&app=web`;
  const res = await ajax<ExerciseResult>("POST", url, {});
  return res;
};

export const getUserInfo = async () => {
  const url = `https://login.fenbi.com/api/users/info?app=web&kav=100&av=121&hav=100&version=3.0.0.0`;
  const res = await ajax("GET", url);
  return res;
};

export const changeQuestionCount = async (params: {
  questionCount: number;
}) => {
  const quesitonInfo = await getUserQuestionInfo();
  const { sheetType, yearScope, correctRatioLow, correctRatioHigh } =
    quesitonInfo.data || {};

  const url = `https://tiku.fenbi.com/activity/userquiz/updateUserQuestionInfo?sheetType=${sheetType}&questionCount=${params.questionCount}&yearScope=${yearScope}&correctRatioLow=${correctRatioLow}&correctRatioHigh=${correctRatioHigh}&app=web&kav=100&av=121&hav=100&version=3.0.0.0`;
  try {
    const res = await ajax("POST", url, {});
    return res;
  } catch (error) {
    throw new Error("Error updating question count");
  }
};

export const getUserQuestionInfo = async () => {
  const url = `https://tiku.fenbi.com/activity/userquiz/getUserQuestionInfo?${WEB_API_QUERY}`;
  const res = await ajax<UserQuestionInfoResponse>("GET", url);
  return res;
};

export const getUserTemplateInfo = async () => {
  const url = `https://tiku.fenbi.com/activity/userquiz/getUserTemplateInfo?${CURRENT_WEB_API_QUERY}`;
  const res = await ajax<UserTemplateInfoResponse>("GET", url);
  return res;
};

export const updateUserTemplateInfo = async (params: { yearScope: number }) => {
  const url = `https://tiku.fenbi.com/activity/userquiz/updateUserTemplateInfo?yearScope=${params.yearScope}&${CURRENT_WEB_API_QUERY}`;
  const res = await ajax("POST", url, {});
  return res;
};

export const getCurrent = async () => {
  const url = `https://login.fenbi.com/api/users/current?kav=121&av=121&hav=121&app=web`;
  const res = await ajax("GET", url);
  return res;
};

export const getMark = async ({
  category = "xingce",
  combineKey,
}: {
  category: string;
  combineKey: string;
}) => {
  return ajax(
    "GET",
    `https://tiku.fenbi.com/combine/mark/getMark?exerciseKey=${combineKey}&routecs=${category}&kav=121&av=121&hav=121&app=web`,
  );
};

export const getCourseSetFavoriteQuiz = async (params: {
  courseSetPrefix: string;
}) => {
  const url = `https://tiku.fenbi.com/activity/userquiz/getCourseSetFavoriteQuiz?courseSetPrefix=${params.courseSetPrefix}&noCacheTag=${Math.round(
    1e3 * Math.random(),
  )}&app=web&kav=125&av=127&hav=125&version=3.0.0.0`;
  const res = await ajax<FavoriteQuizResponse>("GET", url);
  return res;
};

export const courseSetChange = async (params: { category: string }) => {
  const url = `https://tiku.fenbi.com/activity/userquiz/courseSetChange?courseSetPrefix=${params.category}&app=web&kav=100&av=121&hav=100&version=3.0.0.0`;
  const res = await ajax("PUT", url, {});
  return res;
};
