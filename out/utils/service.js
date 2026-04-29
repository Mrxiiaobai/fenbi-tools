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
exports.courseSetChange = exports.getCourseSetFavoriteQuiz = exports.getMark = exports.getCurrent = exports.getUserQuestionInfo = exports.changeQuestionCount = exports.getUserInfo = exports.submit = exports.incr = exports.getHistory = exports.studyTime = exports.getCache = exports.getSolutionQuestion = exports.getSolution = exports.getCategories = exports.getQuestion = exports.getExercisesUrl = exports.getQuickExercisesId = exports.getExercisesId = void 0;
// import * as vscode from "vscode";
const func_1 = require("./func");
const request_1 = require("./request");
const isEssayCategory = (category) => {
    return category === "shenlun" || category === "zhyynl";
};
const getExercisesId = (category = "xingce", params) => __awaiter(void 0, void 0, void 0, function* () {
    const userInfo = yield (0, exports.getUserQuestionInfo)();
    const { questionCount, yearScope, correctRatioLow, correctRatioHigh } = userInfo.data;
    const url = `https://tiku.fenbi.com/api/${category || "xingce"}/exercises?app=web&kav=100&av=121&hav=100&version=3.0.0.0`;
    let limit = questionCount || 15;
    if (isEssayCategory(category)) {
        limit = 1;
    }
    const res = yield (0, request_1.default)("FORM", url, {
        type: 3,
        keypointId: params.keypointId,
        limit: limit,
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
const getQuickExercisesId = (category = "xingce") => __awaiter(void 0, void 0, void 0, function* () {
    const url = `https://tiku.fenbi.com/api/${category || "xingce"}/exercises?app=web&kav=100&av=121&hav=100&version=3.0.0.0`;
    const res = yield (0, request_1.default)("FORM", url, {
        type: 3,
        exerciseTimeMode: 2,
    }, {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    });
    return res;
});
exports.getQuickExercisesId = getQuickExercisesId;
const getExercisesUrl = ({ category = "xingce", combineKey, }) => __awaiter(void 0, void 0, void 0, function* () {
    const url = `https://tiku.fenbi.com/combine/exercise/getExercise?format=html&key=${combineKey}&routecs=${category}&kav=121&av=121&hav=121&app=web`;
    const res = yield (0, request_1.default)("GET", url);
    return res;
});
exports.getExercisesUrl = getExercisesUrl;
const getQuestion = (category, url, type = 1) => __awaiter(void 0, void 0, void 0, function* () {
    const _url = `${url}&routecs=${category}&type=1&kav=121&av=121&hav=121&app=web`;
    const res = yield (0, request_1.default)("GET", _url);
    res["materials"] = (0, func_1.buildMaterialsForQuestions)(res === null || res === void 0 ? void 0 : res.card, res === null || res === void 0 ? void 0 : res.materials);
    return res;
});
exports.getQuestion = getQuestion;
const getCategories = (category) => __awaiter(void 0, void 0, void 0, function* () {
    let url = `https://tiku.fenbi.com/api/${category}/categories?&filter=keypoint&app=web&kav=100&av=121&hav=100&version=3.0.0.0`;
    if (category === "shenlun") {
        url =
            "https://tiku.fenbi.com/api/shenlun/pdpg/categories?app=web&kav=100&av=121&hav=100&version=3.0.0.0";
    }
    if (category === "zhyynl") {
        url =
            "https://tiku.fenbi.com/api/zhyynl/etRuleQuestion/categories?app=web&kav=100&av=121&hav=100&version=3.0.0.0";
    }
    const res = yield (0, request_1.default)("GET", url);
    return res;
});
exports.getCategories = getCategories;
const getSolution = (category = "xingce", combineKey) => __awaiter(void 0, void 0, void 0, function* () {
    const url = `https://tiku.fenbi.com/combine/exercise/getSolution?format=html&key=${combineKey}&routecs=${category}&kav=121&av=121&hav=121&app=web`;
    const res = yield (0, request_1.default)("GET", url);
    return res;
});
exports.getSolution = getSolution;
const getSolutionQuestion = (url, category = "xingce") => __awaiter(void 0, void 0, void 0, function* () {
    const _url = `${url}&routecs=${category}&type=1&kav=121&av=121&hav=121&app=web`;
    const res = yield (0, request_1.default)("GET", _url);
    return res;
});
exports.getSolutionQuestion = getSolutionQuestion;
const getCache = (catrgory = "xingce") => __awaiter(void 0, void 0, void 0, function* () {
    const url = `https://tiku.fenbi.com/api/${catrgory}/category-exercises-unfinished?noCacheTag=${Math.round(1e3 * Math.random())}&app=web&kav=100&av=121&hav=100&version=3.0.0.0`;
    const res = yield (0, request_1.default)("GET", url);
    return res;
});
exports.getCache = getCache;
// export const getQuestion = async (catrgory: string = "xingce", id: number) => {
//   const url = `https://tiku.fenbi.com/api/${catrgory}/universal/auth/questions?type=0&id=${id}&app=web&kav=100&av=121&hav=100&version=3.0.0.0`;
//   const res = await ajax("GET", url);
//   console.log("🚀 ~ getQuestion ~ res:", res);
//   return res;
// };
const studyTime = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const url = `
https://tiku.fenbi.com/activity/report/studyTime?app=web&kav=121&av=121&hav=121&version=3.0.0.0`;
    const res = yield (0, request_1.default)("POST", url, [params]);
    console.log("🚀 ~ studyTime ~ res:", res);
    return res;
});
exports.studyTime = studyTime;
const getHistory = ({ category = "xingce", count = 15, categoryId, }) => __awaiter(void 0, void 0, void 0, function* () {
    const url = `https://tiku.fenbi.com/api/${category}/category-exercises?categoryId=${categoryId}&cursor=0&count=${count}&noCacheTag=${Math.round(1e3 * Math.random())}&app=web&kav=100&av=121&hav=100&version=3.0.0.0`;
    const res = yield (0, request_1.default)("GET", url);
    return res;
});
exports.getHistory = getHistory;
const incr = (category = "xingce", combineKey, params) => __awaiter(void 0, void 0, void 0, function* () {
    const url = `https://tiku.fenbi.com/combine/exercise/incrUpdate?key=${combineKey}&routecs=${category}&kav=121&av=121&hav=121&app=web`;
    // const url = `https://tiku.fenbi.com/api/${category}/async/exercises/${exercisesId}/incr?app=web&kav=100&av=121&hav=100&version=3.0.0.0`;
    const res = yield (0, request_1.default)("POST", url, [params]);
    return res;
});
exports.incr = incr;
const submit = (category = "xingce", combineKey) => __awaiter(void 0, void 0, void 0, function* () {
    const url = `https://tiku.fenbi.com/combine/exercise/submit?key=${combineKey}&routecs=${category}&kav=121&av=121&hav=121&app=web`;
    // const url = `https://tiku.fenbi.com/api/${category}/async/exercises/${exercisesId}/submit?app=web&kav=100&av=121&hav=100&version=3.0.0.0`;
    const res = yield (0, request_1.default)("POST", url, {});
    // if (res.msg == "needPayment") {
    //   return Promise.reject("需要VIP权限，请前往官网购买");
    // }
    return res;
});
exports.submit = submit;
const getUserInfo = () => __awaiter(void 0, void 0, void 0, function* () {
    const url = `https://login.fenbi.com/api/users/info?app=web&kav=100&av=121&hav=100&version=3.0.0.0`;
    const res = yield (0, request_1.default)("GET", url);
    return res;
});
exports.getUserInfo = getUserInfo;
const changeQuestionCount = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const quesitonInfo = yield (0, exports.getUserQuestionInfo)();
    const { sheetType, yearScope, correctRatioLow, correctRatioHigh } = quesitonInfo.data || {};
    const url = `https://tiku.fenbi.com/activity/userquiz/updateUserQuestionInfo?sheetType=${sheetType}&questionCount=${params.questionCount}&yearScope=${yearScope}&correctRatioLow=${correctRatioLow}&correctRatioHigh=${correctRatioHigh}&app=web&kav=100&av=121&hav=100&version=3.0.0.0`;
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
    const url = `https://tiku.fenbi.com/activity/userquiz/getUserQuestionInfo?app=web&kav=100&av=121&hav=100&version=3.0.0.0`;
    const res = yield (0, request_1.default)("GET", url);
    return res;
});
exports.getUserQuestionInfo = getUserQuestionInfo;
const getCurrent = () => __awaiter(void 0, void 0, void 0, function* () {
    const url = `https://login.fenbi.com/api/users/current?kav=121&av=121&hav=121&app=web`;
    const res = yield (0, request_1.default)("GET", url);
    return res;
});
exports.getCurrent = getCurrent;
const getMark = ({ category = "xingce", combineKey, }) => __awaiter(void 0, void 0, void 0, function* () {
    const url = `https://tiku.fenbi.com/combine/mark/getMark?exerciseKey=${combineKey}&routecs=${category}&kav=121&av=121&hav=121&app=web`;
});
exports.getMark = getMark;
const getCourseSetFavoriteQuiz = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const url = `https://tiku.fenbi.com/activity/userquiz/getCourseSetFavoriteQuiz?courseSetPrefix=${params.courseSetPrefix}&noCacheTag=${Math.round(1e3 * Math.random())}&app=web&kav=125&av=127&hav=125&version=3.0.0.0`;
    const res = yield (0, request_1.default)("GET", url);
    return res;
});
exports.getCourseSetFavoriteQuiz = getCourseSetFavoriteQuiz;
const courseSetChange = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const url = `https://tiku.fenbi.com/activity/userquiz/courseSetChange?courseSetPrefix=${params.category}&app=web&kav=100&av=121&hav=100&version=3.0.0.0`;
    const res = yield (0, request_1.default)("PUT", url, {});
    console.log("🚀 ~ courseSetChange ~ res:", res);
    return res;
});
exports.courseSetChange = courseSetChange;
//# sourceMappingURL=service.js.map