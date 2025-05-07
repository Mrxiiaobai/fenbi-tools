"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onDidChangeConfigurationCommand = void 0;
const vscode = require("vscode");
const onDidChangeConfigurationCommand = (callback) => {
    return vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration("fenbiTools")) {
            const updated = vscode.workspace.getConfiguration("fenbiTools");
            if (updated) {
                callback && callback();
            }
        }
    });
};
exports.onDidChangeConfigurationCommand = onDidChangeConfigurationCommand;
//# sourceMappingURL=onDidChangeConfiguration.js.map