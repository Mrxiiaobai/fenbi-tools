import * as vscode from "vscode";
import { modifyArray } from "../utils/func";
import {
  changeQuestionCount,
  getCache,
  getCategories,
  getCurrent,
  // getExercises,
  getExercisesId,
  getExercisesUrl,
  getHistory,
  getQuestion,
  getSolution,
  getSolutionQuestion,
  incr,
  studyTime,
  submit,
} from "../utils/service";
import { webview } from "../utils/webview";

export default class WebviewHandle {
  onDidReceiveMessage() {
    webview.onDidReceiveMessage((message) => {
      const { postData = {}, command = "" } = message || {};

      if (command === "pageInit") this.pageInit(postData);
      if (command === "getQuestion") this.getQuestion(postData);
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
    const res = await getHistory({
      category,
      count: count || 15,
      categoryId: categoryId || undefined,
    });
    webview.postMessage({
      command: "history",
      data: res.datas,
    });
  }

  async pageInit(postData: any) {
    const cacheResult = await getCache(postData?.categoryId || "xingce");
    const res = await getCategories(postData?.categoryId || "xingce");

    const config = vscode.workspace.getConfiguration("fenbiTools");

    webview.postMessage({
      command: "setting",
      data: config,
    });
    // const len = (cacheResult.keypointIds || [])?.length;
    // const lastKeypointIds = len > 0 ? [cacheResult.keypointIds[len - 1]] : [];
    webview.postMessage({
      command: "init",
      // data: modifyArray(res, cacheResult?.keypointIds || []),
      data: {
        menu: res,
        cacheResult: cacheResult || {},
      },
    });

    webview.postMessage({
      command: "pageCache",
      data: cacheResult,
    });
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
      if (category === "shenlun") {
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

  studyTime(params: { exerciseId: number; id: number }) {
    studyTime({
      exerciseId: params.exerciseId,
      // questionIds: [params.id],
      questionId: 0,
      startTime: Date.now(),
      studyTime: 30000, // 30 seconds
      subType: 1,
      tikuPrefix: "xingce",
    });
  }

  async inc(params: any) {
    let answer = {
      type: 201,
      choice: String(params.answer),
    } as any;
    if (params.category == "shenlun") {
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
        params.category
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

  jump(params: { exerciseId: number }) {
    const url = vscode.Uri.parse(
      `https://www.fenbi.com/spa/tiku/report/exam/solution/xingce/xingce/${params.exerciseId}/2`
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
