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
exports.getUserQuestionInfo = exports.changeQuestionCount = exports.getUserInfo = exports.submit = exports.incr = exports.getHistory = exports.studyTime = exports.getQuestion = exports.getCache = exports.getSolution = exports.getCategories = exports.getExercises = exports.getExercisesId = void 0;
// import * as vscode from "vscode";
const request_1 = require("./request");
const getExercisesId = (category = "xingce", params) => __awaiter(void 0, void 0, void 0, function* () {
    const userInfo = yield (0, exports.getUserQuestionInfo)();
    const { questionCount, yearScope, correctRatioLow, correctRatioHigh } = userInfo.data;
    const url = `https://tiku.fenbi.com/api/${category}/exercises?app=web&kav=100&av=100&hav=100&version=3.0.0.0`;
    const res = yield (0, request_1.default)("FORM", url, {
        type: 3,
        keypointId: params.keypointId,
        limit: (params === null || params === void 0 ? void 0 : params.count) || questionCount || 15,
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
const getExercises = (category = "xingce", exerciseId) => __awaiter(void 0, void 0, void 0, function* () {
    const url = `https://tiku.fenbi.com/api/${category}/exercises/${exerciseId}?app=web&kav=100&av=100&hav=100&version=3.0.0.0`;
    const res = yield (0, request_1.default)("GET", url);
    // res.userAnswers
    return res;
});
exports.getExercises = getExercises;
const getCategories = (category) => __awaiter(void 0, void 0, void 0, function* () {
    let url = `https://tiku.fenbi.com/api/${category}/categories?&filter=keypoint&app=web&kav=100&av=100&hav=100&version=3.0.0.0`;
    if (category === "shenlun") {
        url =
            "https://tiku.fenbi.com/api/shenlun/pdpg/categories?app=web&kav=100&av=100&hav=100&version=3.0.0.0";
    }
    const res = yield (0, request_1.default)("GET", url);
    return res;
});
exports.getCategories = getCategories;
const getSolution = (category = "xingce", exerciseId) => __awaiter(void 0, void 0, void 0, function* () {
    const url = `https://tiku.fenbi.com/api/${category}/universal/auth/solutions?type=0&id=${exerciseId}&app=web&kav=100&av=100&hav=100&version=3.0.0.0`;
    const res = yield (0, request_1.default)("GET", url);
    console.log("🚀 ~ getSolution ~ res:", res);
    return res;
});
exports.getSolution = getSolution;
const getCache = (catrgory = "xingce") => __awaiter(void 0, void 0, void 0, function* () {
    const url = `https://tiku.fenbi.com/api/${catrgory}/category-exercises-unfinished?noCacheTag=${Math.round(1e3 * Math.random())}&app=web&kav=100&av=100&hav=100&version=3.0.0.0`;
    const res = yield (0, request_1.default)("GET", url);
    return res;
});
exports.getCache = getCache;
const getQuestion = (catrgory = "xingce", id) => __awaiter(void 0, void 0, void 0, function* () {
    const url = `https://tiku.fenbi.com/api/${catrgory}/universal/auth/questions?type=0&id=${id}&app=web&kav=100&av=100&hav=100&version=3.0.0.0`;
    const res = yield (0, request_1.default)("GET", url);
    console.log("🚀 ~ getQuestion ~ res:", res);
    return res;
});
exports.getQuestion = getQuestion;
const studyTime = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const url = `
https://tiku.fenbi.com/activity/report/studyTime?app=web&kav=100&av=100&hav=100&version=3.0.0.0`;
    const res = yield (0, request_1.default)("POST", url, [params]);
    console.log("🚀 ~ studyTime ~ res:", res);
    return res;
});
exports.studyTime = studyTime;
const getHistory = ({ category = "xingce", count = 15, categoryId, }) => __awaiter(void 0, void 0, void 0, function* () {
    const url = `https://tiku.fenbi.com/api/${category}/category-exercises?categoryId=${categoryId}&cursor=0&count=${count}&noCacheTag=${Math.round(1e3 * Math.random())}&app=web&kav=100&av=100&hav=100&version=3.0.0.0`;
    const res = yield (0, request_1.default)("GET", url);
    return res;
});
exports.getHistory = getHistory;
const incr = (exercisesId, category = "xingce", params) => __awaiter(void 0, void 0, void 0, function* () {
    const url = `https://tiku.fenbi.com/api/${category}/async/exercises/${exercisesId}/incr?app=web&kav=100&av=100&hav=100&version=3.0.0.0`;
    const res = yield (0, request_1.default)("POST", url, [params]);
    console.log("🚀 ~ incr ~ res:", res);
    return res;
});
exports.incr = incr;
const submit = (category = "xingce", exercisesId) => __awaiter(void 0, void 0, void 0, function* () {
    const url = `https://tiku.fenbi.com/api/${category}/async/exercises/${exercisesId}/submit?app=web&kav=100&av=100&hav=100&version=3.0.0.0`;
    const res = yield (0, request_1.default)("FORM", url, { status: 1 }, {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    });
    if (res.msg == "needPayment") {
        return Promise.reject("需要VIP权限，请前往官网购买");
    }
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