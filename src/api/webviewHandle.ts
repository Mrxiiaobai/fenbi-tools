import * as vscode from "vscode";
import { modifyArray } from "../utils/func";
import {
  changeQuestionCount,
  getCache,
  getCategories,
  getExercises,
  getExercisesId,
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

      if (command === "pageInit") this.pageInit();
      if (command === "getQuestion") this.getQuestion(postData);
      if (command === "submit") this.submit(postData);
      if (command === "jumpFenbi") this.jump(postData);
      if (command === "changeQuestionCount") this.changeQuestionCount(postData);
      if (command === "answer") {
        this.studyTime(postData);
        if (message.inc) this.inc(postData);
      }
    });
  }

  async pageInit() {
    const cacheResult = await getCache();
    const res = await getCategories();

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

  async getQuestion({ id, exerciseId }: { id: number; exerciseId?: number }) {
    let postExerciseId = exerciseId;
    if (!postExerciseId) {
      const res = await getExercisesId({ keypointId: id });
      postExerciseId = res.id;
    }
    const exerciseResult = await getExercises(postExerciseId as number);
    const questionResult = await getQuestion(postExerciseId as number);

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
    await incr(params.exerciseId, {
      answer: {
        type: 201,
        choice: String(params.lastAnswer),
      },
      flag: 0,
      questionId: params.lastQuestionId,
      questionIndex: params.lastCount,
      time: Math.floor((Date.now() - params.startTime) / 1000),
    });
  }

  async submit(params: { exerciseId: number }) {
    await this.inc(params);
    await submit(params.exerciseId);
    const exerciseResult = await getExercises(params.exerciseId);
    const res = await getSolution(params.exerciseId);
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
