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
exports.CustomTreeDataProvider = void 0;
const vscode = require("vscode");
const constant_1 = require("../utils/constant");
// const initData = await getCategories();
class CustomTreeDataProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    resolveTreeItem(item, element, token) {
        throw new Error("Method not implemented.");
    }
    getTreeItem(element) {
        const treeItem = new vscode.TreeItem(element === null || element === void 0 ? void 0 : element.label);
        // 配置点击行为
        if (!element.isCategory) {
            treeItem.command = {
                command: "treeView.openContent",
                title: "Open Content",
                arguments: [element],
            };
        }
        treeItem.collapsibleState = element.isCategory
            ? element.collapsibleState
            : vscode.TreeItemCollapsibleState.None;
        return treeItem;
    }
    getParent(element) {
        // if (!element) {
        //   return undefined;
        // }
        return undefined;
    }
    getChildren(element) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!element) {
                // 根节点时返回分类节点
                return Promise.resolve([
                    new CustomItem(constant_1.categoryMap[constant_1.CATEGORIESENUM.CHOOSE_CATE], constant_1.CATEGORIESENUM.CHOOSE_CATE, true, vscode.TreeItemCollapsibleState.Expanded),
                    new CustomItem(constant_1.categoryMap[constant_1.CATEGORIESENUM.ANSWER_QUESTION], constant_1.CATEGORIESENUM.ANSWER_QUESTION, true),
                ]);
            }
            // const categoryData = {
            //   [CATEGORIESENUM.HOT]: getHotSearch,
            //   [CATEGORIESENUM.ENTERTAINMENT]: getWyHot,
            //   [CATEGORIESENUM.NEWS]: getNews,
            // } as { [key: string]: () => Promise<any> };
            // const res = await categoryData[element.id || CATEGORIESENUM.HOT]();
            // if (res.code == -1) {
            //   vscode.window.showInformationMessage(`该类别需要设置cookie`);
            //   return Promise.resolve([]);
            // }
            // if ((res?.data || []).length <= 0) return Promise.resolve([]);
            // const customeTree = (res.data || []).map(
            //   (item: { label: string; id: string }) => {
            //     return new CustomItem(item?.label, item?.id);
            //   }
            // );
            // const context = globalState.getState("context");
            // const panel = webview.init(context.extensionPath, "webview_weibo");
            // webview.setContent({
            //   title: `${res.data?.[0].label}`,
            //   id: res.data?.[0].id,
            // });
            // globalState.setState("webviewPanel", panel);
            // vscode.window.showInformationMessage(`最新热搜：${res.data[0]?.label}`);
            return Promise.resolve([]);
        });
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
}
exports.CustomTreeDataProvider = CustomTreeDataProvider;
class CustomItem extends vscode.TreeItem {
    constructor(label, id, isCategory = false, defaultCollapsibleState = vscode
        .TreeItemCollapsibleState.Collapsed) {
        super(label, defaultCollapsibleState);
        this.isCategory = false;
        this.id = id;
        this.isCategory = isCategory;
        this.collapsibleState = defaultCollapsibleState;
    }
}
//# sourceMappingURL=treeDataProvider.js.map