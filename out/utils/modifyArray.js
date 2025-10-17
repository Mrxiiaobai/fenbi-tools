"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modifyArray = void 0;
const React = require("react");
const modifyArray = (arr, cacheKey, level = 1) => {
    console.log("🚀 ~ modifyArray ~ cacheKey:", cacheKey);
    return arr.map((item) => {
        // 修改属性名
        const newItem = Object.assign(Object.assign({}, item), { key: item.id, label: `${item.name} (${item.answerCount}/${item.count})` });
        if (level > 1) {
            newItem.label = `${item.name} (${item.answerCount}/${item.count}) ${(cacheKey === null || cacheKey === void 0 ? void 0 : cacheKey.includes(item.id)) ? "（继续答题）" : ""}`;
        }
        // 检查是否有子项
        if (item.children) {
            // 如果是第二级（level === 2），添加 "全部" 选项
            if (level === 1) {
                const allOption = Object.assign(Object.assign({}, item), { key: item.id, label: (React.createElement("div", null, `全部 ${(cacheKey === null || cacheKey === void 0 ? void 0 : cacheKey.includes(item.id)) && (cacheKey === null || cacheKey === void 0 ? void 0 : cacheKey.length) == 1
                        ? "（继续答题）"
                        : ""}`)), children: null });
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
//# sourceMappingURL=modifyArray.js.map