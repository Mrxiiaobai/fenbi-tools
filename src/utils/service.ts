import { isEssayCategory } from "../shared/category";
import { buildMaterialsForQuestions } from "../shared/materials";
import {
  CacheData,
  CategoryNode,
  ExerciseKeyResponse,
  ExerciseResult,
  FavoriteQuizResponse,
  HistoryResponse,
  MaterialData,
  QuestionCard,
  QuestionPayload,
  SolutionPayload,
  UserQuestionInfoResponse,
} from "../shared/types";
import ajax from "./request";

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
  }/exercises?app=web&kav=100&av=121&hav=100&version=3.0.0.0`;

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
  }/exercises?app=web&kav=100&av=121&hav=100&version=3.0.0.0`;

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
  const res = await ajax<CategoryNode[]>("GET", url);
  return res;
};

export const getSolution = async (category = "xingce", combineKey: string) => {
  const url = `https://tiku.fenbi.com/combine/exercise/getSolution?format=html&key=${combineKey}&routecs=${category}&kav=121&av=121&hav=121&app=web`;
  const res = await ajax<ExerciseResult>("GET", url);
  return res;
};

export const getSolutionQuestion = async (url: string, category = "xingce") => {
  const _url = `${url}&routecs=${category}&type=1&kav=121&av=121&hav=121&app=web`;
  const res = await ajax<SolutionPayload>("GET", _url);
  return res;
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
  const res = await ajax<ExerciseResult>(
    "POST",
    url,
    {},
  );
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
  const url = `https://tiku.fenbi.com/activity/userquiz/getUserQuestionInfo?app=web&kav=100&av=121&hav=100&version=3.0.0.0`;
  const res = await ajax<UserQuestionInfoResponse>("GET", url);
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
