import * as vscode from "vscode";
import { buildMaterialsForQuestions, modifyArray } from "../utils/func";
import {
  changeQuestionCount,
  courseSetChange,
  getCourseSetFavoriteQuiz,
  getCache,
  getCategories,
  getCurrent,
  // getExercises,
  getExercisesId,
  getExercisesUrl,
  getHistory,
  getQuestion,
  getQuickExercisesId,
  getSolution,
  getSolutionQuestion,
  incr,
  studyTime,
  submit,
} from "../utils/service";
import { webview } from "../utils/webview";

const categoryRouteConfigMap: Record<
  string,
  {
    courseSetPrefix: string;
    tikuPrefix: string;
    answerMode: "objective" | "essay";
    apiCategory: string;
  }
> = {
  xingce: {
    courseSetPrefix: "xingce",
    tikuPrefix: "xingce",
    answerMode: "objective",
    apiCategory: "xingce",
  },
  shenlun: {
    courseSetPrefix: "shenlun",
    tikuPrefix: "shenlun",
    answerMode: "essay",
    apiCategory: "shenlun",
  },
  syzc: {
    courseSetPrefix: "sydw",
    tikuPrefix: "syzc",
    answerMode: "objective",
    apiCategory: "syzc",
  },
  sydw: {
    courseSetPrefix: "sydw",
    tikuPrefix: "sydw",
    answerMode: "objective",
    apiCategory: "sydw",
  },
  zhyynl: {
    courseSetPrefix: "zhyynl",
    tikuPrefix: "zhyynl",
    answerMode: "essay",
    apiCategory: "sydw",
  },
};

const getCategoryRouteConfig = (category?: string) => {
  return categoryRouteConfigMap[category || "xingce"] || categoryRouteConfigMap["xingce"];
};

const isEssayCategory = (category?: string) => {
  return getCategoryRouteConfig(category).answerMode === "essay";
};

const isCareerCategory = (category?: string) => {
  return category === "syzc" || category === "sydw" || category === "zhyynl";
};

const getFavoriteQuizCourseSetPrefix = (category?: string) => {
  return isCareerCategory(category) ? "sydw" : "xingce";
};

export default class WebviewHandle {
  onDidReceiveMessage() {
    webview.onDidReceiveMessage((message) => {
      const { postData = {}, command = "" } = message || {};

      if (command === "pageInit") this.pageInit(postData);
      if (command === "changeCategory") this.changeCategory(postData);
      if (command === "getQuestion") this.getQuestion(postData);
      if (command === "getSolution") this.getSolutions(postData);
      if (command === "getQuickQuestion") this.getQuickQuestion(postData);
      if (command === "submit") this.submit(postData);
      if (command === "jumpFenbi") this.jump(postData);
      if (command === "changeQuestionCount") this.changeQuestionCount(postData);
      if (command === "answer") {
        this.studyTime(postData);
        if (message.inc) this.inc(postData);
      }
      if (command === "history") {
        this.getHistory(postData);
      }
      if (command === "openInBrowser") {
        console.log("openInBrowser", postData);
        vscode.env.openExternal(vscode.Uri.parse(postData.url));
      }
    });
  }

  async getHistory({
    category = "xingce",
    count,
    categoryId,
  }: { category?: string; count?: number; categoryId?: number } = {}) {
    const config = getCategoryRouteConfig(category);
    const res = await getHistory({
      category: config.apiCategory,
      count: count || 15,
      categoryId: categoryId || undefined,
    });
    webview.postMessage({
      command: "history",
      data: res.datas,
    });
  }

  async pageInit(postData: any) {
    const category = postData?.categoryId || "xingce";
    const config = getCategoryRouteConfig(category);
    const cacheResult = await getCache(config.apiCategory);
    const res = await getCategories(category);
    const favoriteQuizLocationName =
      await this.getFavoriteQuizLocationName(category);

    const settingConfig = vscode.workspace.getConfiguration("fenbiTools");

    webview.postMessage({
      command: "setting",
      data: settingConfig,
    });
    // const len = (cacheResult.keypointIds || [])?.length;
    // const lastKeypointIds = len > 0 ? [cacheResult.keypointIds[len - 1]] : [];
    webview.postMessage({
      command: "init",
      // data: modifyArray(res, cacheResult?.keypointIds || []),
      data: {
        categoryId: category,
        favoriteQuizLocationName,
        menu: res,
        cacheResult: cacheResult || {},
      },
    });

    webview.postMessage({
      command: "pageCache",
      data: cacheResult,
    });
  }

  async changeCategory(postData: any) {
    console.log("🚀 ~ WebviewHandle ~ changeCategory ~ postData:", postData);
    const category = postData.categoryId;
    const config = getCategoryRouteConfig(category);
    courseSetChange({ category: config.courseSetPrefix });
  }

  async getFavoriteQuizLocationName(category?: string) {
    const courseSetPrefix = getFavoriteQuizCourseSetPrefix(category);
    try {
      const res = await getCourseSetFavoriteQuiz({ courseSetPrefix });
      const favoriteQuizData = res?.data || res;
      const currentQuizId = favoriteQuizData?.currentQuizVO?.quizId;
      const favoriteQuizVO = favoriteQuizData?.favoriteQuizVO || [];
      const locationName =
        favoriteQuizVO.find((item: { id: number; name: string }) => {
          return item.id === currentQuizId;
        })?.name || "";
      return locationName;
    } catch (error) {
      return "";
    }
  }

  async getQuestion({
    category,
    combineKey,
    id,
  }: {
    category: string;
    combineKey?: string;
    id?: number;
  }) {
    let postCombinKey = combineKey || "";

    if (!postCombinKey) {
      const params = {
        keypointId: id,
      } as any;
      if (isEssayCategory(category)) {
        params.count = 1;
      }
      const res = await getExercisesId(category, params);
      postCombinKey = res.key;
    }

    const exerciseResult = await getExercisesUrl({
      category,
      combineKey: postCombinKey,
    });

    if (exerciseResult?.code == -1) {
      webview.postMessage({
        command: "message",
        data: { message: exerciseResult.message || "获取试题失败" },
      });
      return;
    }

    const staticUrl = exerciseResult?.data?.staticUrl?.urls?.[0];
    const questionResult = await getQuestion(category, staticUrl);

    getCurrent();

    if (exerciseResult?.data?.userAnswers) {
      const userAnswers = exerciseResult?.data?.userAnswers || {};
      (questionResult?.questions || []).forEach((item: any) => {
        for (const key in userAnswers) {
          if (key == item?.globalId) {
            item["userAnswer"] = userAnswers?.[key]?.answer;
          }
        }
      });
    }

    questionResult["exerciseId"] = exerciseResult?.data?.ancientExerciseId?.id;
    questionResult["combinKey"] = postCombinKey;

    webview.postMessage({
      command: "getQuestion",
      data: {
        combineKey: postCombinKey,
        ...questionResult,
      },
    });
  }

  async getQuickQuestion({
    category,
    combineKey,
  }: {
    category: string;
    combineKey?: string;
  }) {
    let postCombinKey = combineKey || "";
    console.log("getQuickQuestion", postCombinKey);

    if (!postCombinKey) {
      const res = await getQuickExercisesId(category);
      postCombinKey = res.key;
    }

    const exerciseResult = await getExercisesUrl({
      category,
      combineKey: postCombinKey,
    });

    if (exerciseResult?.code == -1) {
      webview.postMessage({
        command: "message",
        data: { message: exerciseResult.message || "获取试题失败" },
      });
      return;
    }

    const staticUrl = exerciseResult?.data?.staticUrl?.urls?.[0];

    const questionResult = await getQuestion(category, staticUrl);

    getCurrent();

    if (exerciseResult?.data?.userAnswers) {
      const userAnswers = exerciseResult?.data?.userAnswers || {};
      (questionResult?.questions || []).forEach((item: any) => {
        for (const key in userAnswers) {
          if (key == item?.globalId) {
            item["userAnswer"] = userAnswers?.[key]?.answer;
          }
        }
      });
    }

    questionResult["exerciseId"] = exerciseResult?.data?.ancientExerciseId?.id;
    questionResult["combinKey"] = postCombinKey;

    webview.postMessage({
      command: "getQuestion",
      data: {
        combineKey: postCombinKey,
        ...questionResult,
      },
    });
  }

  studyTime(params: { exerciseId: number; id: number; category: string }) {
    const config = getCategoryRouteConfig(params.category);
    studyTime({
      exerciseId: params.exerciseId,
      // questionIds: [params.id],
      questionId: 0,
      startTime: Date.now(),
      studyTime: 30000, // 30 seconds
      subType: 1,
      tikuPrefix: config.tikuPrefix,
    });
  }

  async inc(params: any) {
    let answer = {
      type: 201,
      choice: String(params.answer),
    } as any;
    if (isEssayCategory(params.category)) {
      answer = {
        type: 204,
        answer: params.answer,
      };
    }
    await incr(params.category, params.combineKey, {
      answer: answer,
      key: params.globalId,
      time: Math.floor((Date.now() - params.startTime) / 1000),
    });
  }

  async submit(params: { category: string; combineKey: string }) {
    // await this.inc(params);
    try {
      const submitRes = await submit(params.category, params.combineKey);
      if (submitRes.msg == "needPayment") {
        webview.postMessage({
          command: "message",
          data: {
            message:
              "需要自行前往粉笔官网开通vip，与本插件无关，由于无VIP，申论后续功能暂无",
          },
        });
        return;
      }

      const res = await getSolution(params.category, params.combineKey);
      const solutionRes = await getSolutionQuestion(
        res?.data?.staticUrl?.urls?.[0],
        params.category,
      );

      (solutionRes?.solutions || []).forEach((item: any) => {
        const userAnswers = res?.data?.userAnswers;
        for (const key in userAnswers) {
          if (key == item.globalId) {
            item["userAnswer"] = userAnswers[key].answer;
          }
        }
      });

      solutionRes["correctCount"] =
        (solutionRes?.solutions || []).filter((item: any) => {
          return item?.userAnswer?.choice == item?.correctAnswer?.choice;
        })?.length || 0;
      solutionRes["questionCount"] = (solutionRes?.solutions || []).length;

      webview.postMessage({
        command: "solution",
        data: solutionRes,
      });
    } catch (error) {
      console.log("🚀 ~ WebviewHandle ~ submit ~ error:", error);
    }
  }

  async getSolutions(postData: { category: string; combineKey: string }) {
    console.log("🚀 ~ WebviewHandle ~ getSolution ~ postData:", postData);
    const res = await getSolution(postData.category, postData.combineKey);
    const solutionRes = await getSolutionQuestion(
      res?.data?.staticUrl?.urls?.[0],
      postData.category,
    );

    (solutionRes?.solutions || []).forEach((item: any) => {
      const userAnswers = res?.data?.userAnswers;
      for (const key in userAnswers) {
        if (key == item.globalId) {
          item["userAnswer"] = userAnswers[key].answer;
        }
      }
    });

    solutionRes["correctCount"] =
      (solutionRes?.solutions || []).filter((item: any) => {
        return item?.userAnswer?.choice == item?.correctAnswer?.choice;
      })?.length || 0;
    solutionRes["questionCount"] = (solutionRes?.solutions || []).length;

    webview.postMessage({
      command: "solution",
      data: solutionRes,
    });
  }

  jump(params: { exerciseId: number; category: string }) {
    const category = params.category || "xingce";
    const url = vscode.Uri.parse(
      `https://www.fenbi.com/spa/tiku/report/exam/solution/${category}/${category}/${params.exerciseId}/2`,
    );
    vscode.env.openExternal(url);
  }

  async changeQuestionCount(params: { questionCount: number }) {
    const res = await changeQuestionCount(params);

    webview.postMessage({
      command: "message",
      data: { message: "修改成功" },
    });
  }
}
