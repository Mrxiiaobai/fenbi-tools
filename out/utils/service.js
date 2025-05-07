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
exports.getUserQuestionInfo = exports.changeQuestionCount = exports.getUserInfo = exports.submit = exports.incr = exports.studyTime = exports.getQuestion = exports.getCache = exports.getSolution = exports.getCategories = exports.getExercises = exports.getExercisesId = void 0;
// import * as vscode from "vscode";
const request_1 = require("./request");
const getExercisesId = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const userInfo = yield (0, exports.getUserQuestionInfo)();
    const { questionCount, yearScope, correctRatioLow, correctRatioHigh } = userInfo.data;
    const url = "https://tiku.fenbi.com/api/xingce/exercises?app=web&kav=100&av=100&hav=100&version=3.0.0.0";
    const res = yield (0, request_1.default)("FORM", url, {
        type: 3,
        keypointId: params.keypointId,
        limit: questionCount || 15,
        exerciseTimeMode: 2,
        yearScope: yearScope,
        correctRatioLow: correctRatioLow,
        correctRatioHigh: correctRatioHigh,
    }, {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    });
    return res;
});
exports.getExercisesId = getExercisesId;
const getExercises = (exerciseId) => __awaiter(void 0, void 0, void 0, function* () {
    const url = `https://tiku.fenbi.com/api/xingce/exercises/${exerciseId}?app=web&kav=100&av=100&hav=100&version=3.0.0.0`;
    const res = yield (0, request_1.default)("GET", url);
    // res.userAnswers
    return res;
});
exports.getExercises = getExercises;
const getCategories = () => __awaiter(void 0, void 0, void 0, function* () {
    const url = "https://tiku.fenbi.com/api/xingce/categories?&filter=keypoint&app=web&kav=100&av=100&hav=100&version=3.0.0.0";
    const res = yield (0, request_1.default)("GET", url);
    return res;
});
exports.getCategories = getCategories;
const getSolution = (exerciseId) => __awaiter(void 0, void 0, void 0, function* () {
    const url = `https://tiku.fenbi.com/api/xingce/universal/auth/solutions?type=0&id=${exerciseId}&app=web&kav=100&av=100&hav=100&version=3.0.0.0`;
    const res = yield (0, request_1.default)("GET", url);
    return res;
});
exports.getSolution = getSolution;
const getCache = () => __awaiter(void 0, void 0, void 0, function* () {
    const url = `https://tiku.fenbi.com/api/xingce/category-exercises-unfinished?noCacheTag=${Math.round(1e3 * Math.random())}&app=web&kav=100&av=100&hav=100&version=3.0.0.0`;
    const res = yield (0, request_1.default)("GET", url);
    return res;
});
exports.getCache = getCache;
const getQuestion = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const url = `https://tiku.fenbi.com/api/xingce/universal/auth/questions?type=0&id=${id}&app=web&kav=100&av=100&hav=100&version=3.0.0.0`;
    const res = yield (0, request_1.default)("GET", url);
    return res;
});
exports.getQuestion = getQuestion;
const studyTime = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const url = `
https://tiku.fenbi.com/activity/report/studyTime?app=web&kav=100&av=100&hav=100&version=3.0.0.0`;
    const res = yield (0, request_1.default)("POST", url, [params]);
    return res;
});
exports.studyTime = studyTime;
const incr = (exercisesId, params) => __awaiter(void 0, void 0, void 0, function* () {
    const url = `https://tiku.fenbi.com/api/xingce/async/exercises/${exercisesId}/incr?app=web&kav=100&av=100&hav=100&version=3.0.0.0`;
    const res = yield (0, request_1.default)("POST", url, [params]);
    return res;
});
exports.incr = incr;
const submit = (exercisesId) => __awaiter(void 0, void 0, void 0, function* () {
    const url = `https://tiku.fenbi.com/api/xingce/async/exercises/${exercisesId}/submit?app=web&kav=100&av=100&hav=100&version=3.0.0.0`;
    const res = yield (0, request_1.default)("FORM", url, { status: 1 }, {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    });
    return res;
});
exports.submit = submit;
const getUserInfo = () => __awaiter(void 0, void 0, void 0, function* () {
    const url = `https://login.fenbi.com/api/users/info?app=web&kav=100&av=100&hav=100&version=3.0.0.0`;
    const res = yield (0, request_1.default)("GET", url);
    return res;
});
exports.getUserInfo = getUserInfo;
const changeQuestionCount = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const quesitonInfo = yield (0, exports.getUserQuestionInfo)();
    const { sheetType, yearScope, correctRatioLow, correctRatioHigh } = quesitonInfo.data || {};
    const url = `https://tiku.fenbi.com/activity/userquiz/updateUserQuestionInfo?sheetType=${sheetType}&questionCount=${params.questionCount}&yearScope=${yearScope}&correctRatioLow=${correctRatioLow}&correctRatioHigh=${correctRatioHigh}&app=web&kav=100&av=100&hav=100&version=3.0.0.0`;
    try {
        const res = yield (0, request_1.default)("POST", url, {});
        return res;
    }
    catch (error) {
        throw new Error("Error updating question count");
    }
});
exports.changeQuestionCount = changeQuestionCount;
const getUserQuestionInfo = () => __awaiter(void 0, void 0, void 0, function* () {
    const url = `https://tiku.fenbi.com/activity/userquiz/getUserQuestionInfo?app=web&kav=100&av=100&hav=100&version=3.0.0.0`;
    const res = yield (0, request_1.default)("GET", url);
    return res;
});
exports.getUserQuestionInfo = getUserQuestionInfo;
//# sourceMappingURL=service.js.map