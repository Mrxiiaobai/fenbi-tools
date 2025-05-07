"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const func_1 = require("../utils/func");
const service_1 = require("../utils/service");
const webview_1 = require("../utils/webview");
class WebviewHandle {
    onDidReceiveMessage() {
        webview_1.webview.onDidReceiveMessage((message) => {
            const { postData = {}, command = "" } = message || {};
            if (command === "pageInit")
                this.pageInit();
            if (command === "getQuestion")
                this.getQuestion(postData);
            if (command === "submit")
                this.submit(postData);
            if (command === "jumpFenbi")
                this.jump(postData);
            if (command === "changeQuestionCount")
                this.changeQuestionCount(postData);
            if (command === "answer") {
                this.studyTime(postData);
                if (message.inc)
                    this.inc(postData);
            }
        });
    }
    pageInit() {
        return __awaiter(this, void 0, void 0, function* () {
            const cacheResult = yield (0, service_1.getCache)();
            const res = yield (0, service_1.getCategories)();
            const config = vscode.workspace.getConfiguration("fenbiTools");
            webview_1.webview.postMessage({
                command: "setting",
                data: config,
            });
            webview_1.webview.postMessage({
                command: "init",
                data: (0, func_1.modifyArray)(res, cacheResult.keypointIds),
            });
            webview_1.webview.postMessage({
                command: "pageCache",
                data: cacheResult,
            });
        });
    }
    getQuestion({ id, exerciseId }) {
        return __awaiter(this, void 0, void 0, function* () {
            let postExerciseId = exerciseId;
            if (!postExerciseId) {
                const res = yield (0, service_1.getExercisesId)({ keypointId: id });
                postExerciseId = res.id;
            }
            const exerciseResult = yield (0, service_1.getExercises)(postExerciseId);
            const questionResult = yield (0, service_1.getQuestion)(postExerciseId);
            if (exerciseResult === null || exerciseResult === void 0 ? void 0 : exerciseResult.userAnswers) {
                const userAnswers = exerciseResult.userAnswers;
                ((questionResult === null || questionResult === void 0 ? void 0 : questionResult.questions) || []).forEach((item) => {
                    var _a;
                    for (const key in userAnswers) {
                        if (((_a = userAnswers[key]) === null || _a === void 0 ? void 0 : _a.questionId) == item.id) {
                            item["userAnswer"] = userAnswers[key].answer;
                        }
                    }
                });
            }
            webview_1.webview.postMessage({
                command: "getQuestion",
                data: Object.assign({ exerciseId: postExerciseId }, questionResult),
            });
        });
    }
    studyTime(params) {
        (0, service_1.studyTime)({
            exerciseId: params.index,
            questionIds: [params.id],
            startTime: Date.now(),
            studyTime: 30000,
            subType: 1,
            tikuPrefix: "xingce",
        });
    }
    inc(params) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, service_1.incr)(params.exerciseId, {
                answer: {
                    type: 201,
                    choice: String(params.lastAnswer),
                },
                flag: 0,
                questionId: params.lastQuestionId,
                questionIndex: params.lastCount,
                time: Math.floor((Date.now() - params.startTime) / 1000),
            });
        });
    }
    submit(params) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.inc(params);
            yield (0, service_1.submit)(params.exerciseId);
            const exerciseResult = yield (0, service_1.getExercises)(params.exerciseId);
            const res = yield (0, service_1.getSolution)(params.exerciseId);
            res["correctCount"] = exerciseResult.correctCount;
            res["questionCount"] = exerciseResult.questionCount;
            if (exerciseResult === null || exerciseResult === void 0 ? void 0 : exerciseResult.userAnswers) {
                const userAnswers = exerciseResult.userAnswers;
                ((res === null || res === void 0 ? void 0 : res.solutions) || []).forEach((item) => {
                    for (const key in userAnswers) {
                        if (userAnswers[key].questionId == item.id) {
                            item["userAnswer"] = userAnswers[key].answer;
                        }
                    }
                });
            }
            webview_1.webview.postMessage({
                command: "solution",
                data: res,
            });
        });
    }
    jump(params) {
        const url = vscode.Uri.parse(`https://www.fenbi.com/spa/tiku/report/exam/solution/xingce/xingce/${params.exerciseId}/2`);
        vscode.env.openExternal(url);
    }
    changeQuestionCount(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield (0, service_1.changeQuestionCount)(params);
            console.log("🚀 ~ WebviewHandle ~ changeQuestionCount ~ res:", res);
            webview_1.webview.postMessage({
                command: "message",
                data: { message: "修改成功" },
            });
        });
    }
}
exports.default = WebviewHandle;
//# sourceMappingURL=webviewHandle.js.map