"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getScriptUri = void 0;
const path_1 = require("path");
const globalState_1 = require("./globalState");
const vscode = require("vscode");
const getScriptUri = (extensionPath) => {
    const jsPath = globalState_1.globalState.getState("jsPath");
    const scriptPath = vscode.Uri.file(path_1.default.join(extensionPath, jsPath));
    return scriptPath;
};
exports.getScriptUri = getScriptUri;
//# sourceMappingURL=getScriptUri.js.map