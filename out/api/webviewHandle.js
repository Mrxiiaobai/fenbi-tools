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
const service_1 = require("../utils/service");
const webview_1 = require("../utils/webview");
class WebviewHandle {
    onDidReceiveMessage() {
        webview_1.webview.onDidReceiveMessage((message) => {
            const { postData = {}, command = "" } = message || {};
            if (command === "pageInit")
                this.pageInit(postData);
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
            if (command === "history") {
                this.getHistory(postData);
            }
            if (command === "openInBrowser") {
                console.log("openInBrowser", postData);
                vscode.env.openExternal(vscode.Uri.parse(postData.url));
            }
        });
    }
    getHistory({ category = "xingce", count, categoryId, } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield (0, service_1.getHistory)({
                category,
                count: count || 15,
                categoryId: categoryId || undefined,
            });
            webview_1.webview.postMessage({
                command: "history",
                data: res.datas,
            });
        });
    }
    pageInit(postData) {
        return __awaiter(this, void 0, void 0, function* () {
            const cacheResult = yield (0, service_1.getCache)((postData === null || postData === void 0 ? void 0 : postData.categoryId) || "xingce");
            const res = yield (0, service_1.getCategories)((postData === null || postData === void 0 ? void 0 : postData.categoryId) || "xingce");
            const config = vscode.workspace.getConfiguration("fenbiTools");
            webview_1.webview.postMessage({
                command: "setting",
                data: config,
            });
            // const len = (cacheResult.keypointIds || [])?.length;
            // const lastKeypointIds = len > 0 ? [cacheResult.keypointIds[len - 1]] : [];
            webview_1.webview.postMessage({
                command: "init",
                // data: modifyArray(res, cacheResult?.keypointIds || []),
                data: {
                    menu: res,
                    cacheResult: cacheResult || {},
                },
            });
            webview_1.webview.postMessage({
                command: "pageCache",
                data: cacheResult,
            });
        });
    }
    getQuestion({ category, combineKey, id, }) {
        var _a, _b, _c, _d, _e, _f, _g;
        return __awaiter(this, void 0, void 0, function* () {
            let postCombinKey = combineKey || "";
            if (!postCombinKey) {
                const params = {
                    keypointId: id,
                };
                if (category === "shenlun") {
                    params.count = 1;
                }
                const res = yield (0, service_1.getExercisesId)(category, params);
                postCombinKey = res.key;
            }
            const exerciseResult = yield (0, service_1.getExercisesUrl)({
                category,
                combineKey: postCombinKey,
            });
            if ((exerciseResult === null || exerciseResult === void 0 ? void 0 : exerciseResult.code) == -1) {
                webview_1.webview.postMessage({
                    command: "message",
                    data: { message: exerciseResult.message || "获取试题失败" },
                });
                return;
            }
            const staticUrl = (_c = (_b = (_a = exerciseResult === null || exerciseResult === void 0 ? void 0 : exerciseResult.data) === null || _a === void 0 ? void 0 : _a.staticUrl) === null || _b === void 0 ? void 0 : _b.urls) === null || _c === void 0 ? void 0 : _c[0];
            const questionResult = yield (0, service_1.getQuestion)(category, staticUrl);
            (0, service_1.getCurrent)();
            if ((_d = exerciseResult === null || exerciseResult === void 0 ? void 0 : exerciseResult.data) === null || _d === void 0 ? void 0 : _d.userAnswers) {
                const userAnswers = ((_e = exerciseResult === null || exerciseResult === void 0 ? void 0 : exerciseResult.data) === null || _e === void 0 ? void 0 : _e.userAnswers) || {};
                ((questionResult === null || questionResult === void 0 ? void 0 : questionResult.questions) || []).forEach((item) => {
                    var _a;
                    for (const key in userAnswers) {
                        if (key == (item === null || item === void 0 ? void 0 : item.globalId)) {
                            item["userAnswer"] = (_a = userAnswers === null || userAnswers === void 0 ? void 0 : userAnswers[key]) === null || _a === void 0 ? void 0 : _a.answer;
                        }
                    }
                });
            }
            questionResult["exerciseId"] = (_g = (_f = exerciseResult === null || exerciseResult === void 0 ? void 0 : exerciseResult.data) === null || _f === void 0 ? void 0 : _f.ancientExerciseId) === null || _g === void 0 ? void 0 : _g.id;
            questionResult["combinKey"] = postCombinKey;
            webview_1.webview.postMessage({
                command: "getQuestion",
                data: Object.assign({ combineKey: postCombinKey }, questionResult),
            });
        });
    }
    studyTime(params) {
        (0, service_1.studyTime)({
            exerciseId: params.exerciseId,
            // questionIds: [params.id],
            questionId: 0,
            startTime: Date.now(),
            studyTime: 30000,
            subType: 1,
            tikuPrefix: "xingce",
        });
    }
    inc(params) {
        return __awaiter(this, void 0, void 0, function* () {
            let answer = {
                type: 201,
                choice: String(params.answer),
            };
            if (params.category == "shenlun") {
                answer = {
                    type: 204,
                    answer: params.answer,
                };
            }
            yield (0, service_1.incr)(params.category, params.combineKey, {
                answer: answer,
                key: params.globalId,
                time: Math.floor((Date.now() - params.startTime) / 1000),
            });
        });
    }
    submit(params) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            // await this.inc(params);
            try {
                const submitRes = yield (0, service_1.submit)(params.category, params.combineKey);
                if (submitRes.msg == "needPayment") {
                    webview_1.webview.postMessage({
                        command: "message",
                        data: {
                            message: "需要自行前往粉笔官网开通vip，与本插件无关，由于无VIP，申论后续功能暂无",
                        },
                    });
                    return;
                }
                const res = yield (0, service_1.getSolution)(params.category, params.combineKey);
                const solutionRes = yield (0, service_1.getSolutionQuestion)((_c = (_b = (_a = res === null || res === void 0 ? void 0 : res.data) === null || _a === void 0 ? void 0 : _a.staticUrl) === null || _b === void 0 ? void 0 : _b.urls) === null || _c === void 0 ? void 0 : _c[0], params.category);
                ((solutionRes === null || solutionRes === void 0 ? void 0 : solutionRes.solutions) || []).forEach((item) => {
                    var _a;
                    const userAnswers = (_a = res === null || res === void 0 ? void 0 : res.data) === null || _a === void 0 ? void 0 : _a.userAnswers;
                    for (const key in userAnswers) {
                        if (key == item.globalId) {
                            item["userAnswer"] = userAnswers[key].answer;
                        }
                    }
                });
                solutionRes["correctCount"] =
                    ((_d = ((solutionRes === null || solutionRes === void 0 ? void 0 : solutionRes.solutions) || []).filter((item) => {
                        var _a, _b;
                        return ((_a = item === null || item === void 0 ? void 0 : item.userAnswer) === null || _a === void 0 ? void 0 : _a.choice) == ((_b = item === null || item === void 0 ? void 0 : item.correctAnswer) === null || _b === void 0 ? void 0 : _b.choice);
                    })) === null || _d === void 0 ? void 0 : _d.length) || 0;
                solutionRes["questionCount"] = ((solutionRes === null || solutionRes === void 0 ? void 0 : solutionRes.solutions) || []).length;
                webview_1.webview.postMessage({
                    command: "solution",
                    data: solutionRes,
                });
            }
            catch (error) {
                console.log("🚀 ~ WebviewHandle ~ submit ~ error:", error);
            }
        });
    }
    jump(params) {
        const url = vscode.Uri.parse(`https://www.fenbi.com/spa/tiku/report/exam/solution/xingce/xingce/${params.exerciseId}/2`);
        vscode.env.openExternal(url);
    }
    changeQuestionCount(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield (0, service_1.changeQuestionCount)(params);
            webview_1.webview.postMessage({
                command: "message",
                data: { message: "修改成功" },
            });
        });
    }
}
exports.default = WebviewHandle;
//# sourceMappingURL=webviewHandle.js.map