"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = void 0;
const vscode = require("vscode");
const onDidChangeConfiguration_1 = require("../commands/onDidChangeConfiguration");
const func_1 = require("../utils/func");
const globalState_1 = require("../utils/globalState");
const init = (customTreeDataProvider) => {
    const config = vscode.workspace.getConfiguration("fenbiTools");
    const onRefresh = () => {
        customTreeDataProvider.refresh();
    };
    vscode.commands.registerCommand("openFenbiWebview.refreshEntry", () => {
        onRefresh();
    });
    const context = globalState_1.globalState.getState("context");
    context.subscriptions.push(
    // 监听配置变化
    (0, onDidChangeConfiguration_1.onDidChangeConfigurationCommand)(() => {
        const config = vscode.workspace.getConfiguration("fenbiTools");
        func_1.runInterval.start(onRefresh, config.interval || 30);
    }));
};
exports.init = init;
//# sourceMappingURL=init.js.map