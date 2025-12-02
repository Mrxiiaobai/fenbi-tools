"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMaterialsForQuestions = exports.modifyArray = exports.getScriptUri = exports.templateHtml = exports.getScriptPath = exports.analyze = exports.runInterval = exports.interval = void 0;
const vscode = require("vscode");
const config_1 = require("../config");
const cheerio = require("cheerio");
const path = require("path");
const interval = () => {
    let timerId = null;
    function start(callback, delay) {
        stop(); // 停止之前的计时器
        timerId = setInterval(callback, delay * 60000);
        return timerId;
    }
    function stop() {
        if (timerId) {
            clearInterval(timerId);
            timerId = null;
        }
    }
    return { start, stop };
};
exports.interval = interval;
exports.runInterval = (0, exports.interval)();
const getContent = ($, element) => {
    let content = "";
    const childElements = $(element).contents();
    childElements.each((childIndex, childElement) => {
        if (childElement.nodeType === 3) {
            // 文本节点
            content += $(childElement).text();
        }
        else if (childElement.tagName === "a") {
            // a标签节点
            content += $(childElement).text();
        }
    });
    return content;
};
const analyze = (htmlContent) => {
    var _a, _b;
    const $ = cheerio.load(htmlContent);
    const containerElement = $("div.woo-box-flex");
    if (!containerElement || !htmlContent) {
        vscode.window.showInformationMessage("cookie过期，请重新设置cookie");
        return;
    }
    const listItem = $(containerElement).find('div[action-type="feed_list_item"]');
    const topicElement = $(containerElement).find("div.card-topic-lead");
    let arr = [];
    listItem.each((index, element) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        const nickName = $(element).find("a.name").text().trim();
        let descriptions = "";
        let content = "";
        const descriptionElements = $((_a = $(element).find("div.from")) === null || _a === void 0 ? void 0 : _a[0]).find("a") || [];
        const contentElements = $((_b = $(element).find("p[node-type=feed_list_content]")) === null || _b === void 0 ? void 0 : _b[0]) || [];
        const contentFullElements = $((_c = $(element).find("p[node-type=feed_list_content_full]")) === null || _c === void 0 ? void 0 : _c[0]) || [];
        const forwardElement = (_d = $(element).find("a[action-type=feed_list_forward]")) === null || _d === void 0 ? void 0 : _d[0];
        const commentElement = (_e = $(element).find("a[action-type=feed_list_comment]")) === null || _e === void 0 ? void 0 : _e[0];
        const likeElement = (_f = $(element).find("a[action-type=feed_list_like]")) === null || _f === void 0 ? void 0 : _f[0];
        if (contentFullElements.length > 0) {
            content = getContent($, contentFullElements);
        }
        else {
            content = getContent($, contentElements);
        }
        descriptionElements.each((index, element) => {
            var _a, _b;
            descriptions += ((_b = (_a = $(element)) === null || _a === void 0 ? void 0 : _a.text()) === null || _b === void 0 ? void 0 : _b.trim()) + "  ";
        });
        const forward = ((_h = (_g = $(forwardElement)) === null || _g === void 0 ? void 0 : _g.text()) === null || _h === void 0 ? void 0 : _h.trim()) || 0;
        const comment = ((_k = (_j = $(commentElement)) === null || _j === void 0 ? void 0 : _j.text()) === null || _k === void 0 ? void 0 : _k.trim()) || 0;
        const like = ((_m = (_l = $(likeElement)) === null || _l === void 0 ? void 0 : _l.text()) === null || _m === void 0 ? void 0 : _m.trim()) || 0;
        arr.push({
            nickName,
            descriptions,
            content,
            forward,
            comment,
            like,
        });
    });
    const topic = (_b = (_a = $(topicElement)) === null || _a === void 0 ? void 0 : _a.text()) === null || _b === void 0 ? void 0 : _b.trim();
    return {
        topic,
        data: arr,
    };
};
exports.analyze = analyze;
const getScriptPath = (extensionPath) => {
    const scriptPath = vscode.Uri.file(path.join(extensionPath, config_1.mainConfig.jsPath));
    return scriptPath;
};
exports.getScriptPath = getScriptPath;
const templateHtml = (scriptUri) => {
    return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>详情</title>
    </head>
    <body>
      <div id="loading">页面初始化中...</div>
      <div id="root"></div>
      <script src=${scriptUri}></script>
    </body>
  </html>`;
};
exports.templateHtml = templateHtml;
const getScriptUri = (webview, scriptPath) => {
    const scriptUri = webview.webview.asWebviewUri(scriptPath);
    return scriptUri;
};
exports.getScriptUri = getScriptUri;
const modifyArray = (arr, cacheKey, level = 1) => {
    return arr.map((item) => {
        // 修改属性名
        const newItem = Object.assign(Object.assign({}, item), { key: item.id, label: `${item.name} (${item.answerCount}/${item.count})` });
        if (level > 1) {
            newItem.label = `${item.name} (${item.answerCount}/${item.count}) ${(cacheKey === null || cacheKey === void 0 ? void 0 : cacheKey.includes(item.id)) ? "【继续答题】" : ""}`;
        }
        // 检查是否有子项
        if (item.children) {
            // 如果是第二级（level === 2），添加 "全部" 选项
            if (level === 1) {
                const allOption = Object.assign(Object.assign({}, item), { key: item.id, label: `全部 ${(cacheKey === null || cacheKey === void 0 ? void 0 : cacheKey.includes(item.id)) && (cacheKey === null || cacheKey === void 0 ? void 0 : cacheKey.length) == 1
                        ? "【继续答题】"
                        : ""}`, children: null });
                // 递归处理子项，并在第二级添加 "全部"
                newItem.children = [
                    allOption,
                    ...(0, exports.modifyArray)(item.children, cacheKey, level + 1),
                ];
            }
            else {
                // 递归处理子项，递增级别
                newItem.children = (0, exports.modifyArray)(item.children, cacheKey, level + 1);
            }
        }
        return newItem;
    });
};
exports.modifyArray = modifyArray;
/**
 * 根据 cards 的顺序，生成一个 materialsForRender 数组
 * 让 materialsForRender[index] === 当前题目的展示图片（仅首次出现时才有）
 */
const buildMaterialsForQuestions = (cards, materials) => {
    // 方便快速查询 globalId → content
    const materialContentMap = new Map(materials.map((m) => [m.globalId, m.content]));
    const usedMaterialKeys = new Set(); // 已经展示过的素材
    const materialsForRender = []; // 最终用于页面渲染的 materials[index]
    const questions = cards === null || cards === void 0 ? void 0 : cards.children[0].children; // 题目顺序数组
    questions.forEach((q, index) => {
        const keys = q.materialKeys;
        if (!keys || keys.length === 0) {
            materialsForRender[index] = null;
            return;
        }
        const key = keys[0];
        // 第一次出现 → 允许展示图片
        if (!usedMaterialKeys.has(key)) {
            usedMaterialKeys.add(key);
            materialsForRender[index] = {
                key,
                content: materialContentMap.get(key) || null,
            };
        }
        else {
            // 后续重复出现 → 不展示图
            materialsForRender[index] = null;
        }
    });
    return materialsForRender;
};
exports.buildMaterialsForQuestions = buildMaterialsForQuestions;
//# sourceMappingURL=func.js.map