import * as vscode from "vscode";
import { modifyArray } from "../utils/func";
import {
  changeQuestionCount,
  getCache,
  getCategories,
  getExercises,
  getExercisesId,
  getHistory,
  getQuestion,
  getSolution,
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
    console.log("🚀 ~ WebviewHandle ~ getHistory ~ category:", category);
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
    webview.postMessage({
      command: "init",
      data: modifyArray(res, cacheResult.keypointIds),
    });

    webview.postMessage({
      command: "pageCache",
      data: cacheResult,
    });
  }

  async getQuestion({
    category,
    id,
    exerciseId,
  }: {
    category: string;
    id: number;
    exerciseId?: number;
  }) {
    let postExerciseId = exerciseId;
    if (!postExerciseId) {
      const params = {
        keypointId: id,
      } as any;
      if (category === "shenlun") {
        params.count = 1;
      }
      const res = await getExercisesId(category, params);
      postExerciseId = res.id;
    }
    const exerciseResult = await getExercises(
      category,
      postExerciseId as number
    );
    const questionResult = await getQuestion(
      category,
      postExerciseId as number
    );

    if (exerciseResult?.userAnswers) {
      const userAnswers = exerciseResult.userAnswers;
      (questionResult?.questions || []).forEach((item: any) => {
        for (const key in userAnswers) {
          if (userAnswers[key]?.questionId == item.id) {
            item["userAnswer"] = userAnswers[key].answer;
          }
        }
      });
    }

    webview.postMessage({
      command: "getQuestion",
      data: {
        exerciseId: postExerciseId,
        ...questionResult,
      },
    });
  }

  studyTime(params: { index: number; id: number }) {
    studyTime({
      exerciseId: params.index,
      questionIds: [params.id],
      startTime: Date.now(),
      studyTime: 30000, // 30 seconds
      subType: 1,
      tikuPrefix: "xingce",
    });
  }

  async inc(params: any) {
    let answer = {
      type: 201,
      choice: String(params.lastAnswer),
    } as any;
    if (params.category == "shenlun") {
      answer = {
        type: 204,
        answer: params.answer,
      };
    }
    await incr(params.category, params.exerciseId, {
      answer: answer,
      flag: 0,
      questionId: params.lastQuestionId,
      questionIndex: params.lastCount,
      time: Math.floor((Date.now() - params.startTime) / 1000),
    });
  }

  async submit(params: { category: string; exerciseId: number }) {
    await this.inc(params);
    try {
      await submit(params.category, params.exerciseId);

      const exerciseResult = await getExercises(
        params.category,
        params.exerciseId
      );
      const res = await getSolution(params.category, params.exerciseId);
      res["correctCount"] = exerciseResult.correctCount;
      res["questionCount"] = exerciseResult.questionCount;

      if (exerciseResult?.userAnswers) {
        const userAnswers = exerciseResult.userAnswers;
        (res?.solutions || []).forEach((item: any) => {
          for (const key in userAnswers) {
            if (userAnswers[key].questionId == item.id) {
              item["userAnswer"] = userAnswers[key].answer;
            }
          }
        });
      }
      webview.postMessage({
        command: "solution",
        data: res,
      });
    } catch (error) {
      webview.postMessage({
        command: "message",
        data: {
          message:
            "需要自行前往粉笔官网开通vip，与本插件无关，由于无VIP，申论后续功能暂无",
        },
      });
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
    console.log("🚀 ~ WebviewHandle ~ changeQuestionCount ~ res:", res);

    webview.postMessage({
      command: "message",
      data: { message: "修改成功" },
    });
  }
}
