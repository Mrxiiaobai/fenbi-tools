// import * as vscode from "vscode";
import ajax from "./request";

export const getExercisesId = async (
  category = "xingce",
  params: { count?: number; keypointId: number }
) => {
  const userInfo = await getUserQuestionInfo();
  const { questionCount, yearScope, correctRatioLow, correctRatioHigh } =
    userInfo.data;
  const url = `https://tiku.fenbi.com/api/${category}/exercises?app=web&kav=100&av=100&hav=100&version=3.0.0.0`;
  const res = await ajax(
    "FORM",
    url,
    {
      type: 3,
      keypointId: params.keypointId,
      limit: params?.count || questionCount || 15,
      exerciseTimeMode: 2,
      yearScope: yearScope,
      correctRatioLow: correctRatioLow,
      correctRatioHigh: correctRatioHigh,
    },
    {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    }
  );

  return res;
};

export const getExercises = async (category = "xingce", exerciseId: number) => {
  const url = `https://tiku.fenbi.com/api/${category}/exercises/${exerciseId}?app=web&kav=100&av=100&hav=100&version=3.0.0.0`;
  const res = await ajax("GET", url);
  // res.userAnswers
  return res;
};

export const getCategories = async (category: string) => {
  let url = `https://tiku.fenbi.com/api/${category}/categories?&filter=keypoint&app=web&kav=100&av=100&hav=100&version=3.0.0.0`;
  if (category === "shenlun") {
    url =
      "https://tiku.fenbi.com/api/shenlun/pdpg/categories?app=web&kav=100&av=100&hav=100&version=3.0.0.0";
  }
  const res = await ajax("GET", url);
  return res;
};

export const getSolution = async (category = "xingce", exerciseId: number) => {
  const url = `https://tiku.fenbi.com/api/${category}/universal/auth/solutions?type=0&id=${exerciseId}&app=web&kav=100&av=100&hav=100&version=3.0.0.0`;
  const res = await ajax("GET", url);
  console.log("🚀 ~ getSolution ~ res:", res);
  return res;
};

export const getCache = async (catrgory: string = "xingce") => {
  const url = `https://tiku.fenbi.com/api/${catrgory}/category-exercises-unfinished?noCacheTag=${Math.round(
    1e3 * Math.random()
  )}&app=web&kav=100&av=100&hav=100&version=3.0.0.0`;
  const res = await ajax("GET", url);
  return res;
};

export const getQuestion = async (catrgory: string = "xingce", id: number) => {
  const url = `https://tiku.fenbi.com/api/${catrgory}/universal/auth/questions?type=0&id=${id}&app=web&kav=100&av=100&hav=100&version=3.0.0.0`;
  const res = await ajax("GET", url);
  console.log("🚀 ~ getQuestion ~ res:", res);
  return res;
};

export const studyTime = async (params: {
  exerciseId: number;
  questionIds: number[];
  startTime: number;
  studyTime: number;
  subType: number;
  tikuPrefix: string;
}) => {
  const url = `
https://tiku.fenbi.com/activity/report/studyTime?app=web&kav=100&av=100&hav=100&version=3.0.0.0`;
  const res = await ajax("POST", url, [params]);
  console.log("🚀 ~ studyTime ~ res:", res);
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
    1e3 * Math.random()
  )}&app=web&kav=100&av=100&hav=100&version=3.0.0.0`;
  const res = await ajax("GET", url);
  return res;
};

export const incr = async (
  exercisesId: number,
  category: string = "xingce",
  params: {
    answer: { type: number; choice?: string; answer?: string };
    flag: number;
    questionId: number;
    questionIndex: number;
    time: number;
  }
) => {
  const url = `https://tiku.fenbi.com/api/${category}/async/exercises/${exercisesId}/incr?app=web&kav=100&av=100&hav=100&version=3.0.0.0`;
  const res = await ajax("POST", url, [params]);
  console.log("🚀 ~ incr ~ res:", res);
  return res;
};

export const submit = async (category = "xingce", exercisesId: number) => {
  const url = `https://tiku.fenbi.com/api/${category}/async/exercises/${exercisesId}/submit?app=web&kav=100&av=100&hav=100&version=3.0.0.0`;
  const res = await ajax(
    "FORM",
    url,
    { status: 1 },
    {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    }
  );
  if (res.msg == "needPayment") {
    return Promise.reject("需要VIP权限，请前往官网购买");
  }
  return res;
};

export const getUserInfo = async () => {
  const url = `https://login.fenbi.com/api/users/info?app=web&kav=100&av=100&hav=100&version=3.0.0.0`;
  const res = await ajax("GET", url);
  return res;
};

export const changeQuestionCount = async (params: {
  questionCount: number;
}) => {
  const quesitonInfo = await getUserQuestionInfo();
  const { sheetType, yearScope, correctRatioLow, correctRatioHigh } =
    quesitonInfo.data || {};

  const url = `https://tiku.fenbi.com/activity/userquiz/updateUserQuestionInfo?sheetType=${sheetType}&questionCount=${params.questionCount}&yearScope=${yearScope}&correctRatioLow=${correctRatioLow}&correctRatioHigh=${correctRatioHigh}&app=web&kav=100&av=100&hav=100&version=3.0.0.0`;
  try {
    const res = await ajax("POST", url, {});
    return res;
  } catch (error) {
    throw new Error("Error updating question count");
  }
};

export const getUserQuestionInfo = async () => {
  const url = `https://tiku.fenbi.com/activity/userquiz/getUserQuestionInfo?app=web&kav=100&av=100&hav=100&version=3.0.0.0`;
  const res = await ajax("GET", url);
  return res;
};
