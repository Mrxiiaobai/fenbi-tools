"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const workspacePath = (_b = (_a = vscode === null || vscode === void 0 ? void 0 : vscode.workspace) === null || _a === void 0 ? void 0 : _a.workspaceFolders) === null || _b === void 0 ? void 0 : _b[0].uri.fsPath;
const baseConfig = {
    workspacePath: `${workspacePath}`,
    gaodeApiKey: "460bd80408b5c0c51a5660bd8ae8f707",
    jsPath: "out/views/fish.js",
};
exports.default = baseConfig;
//# sourceMappingURL=base.js.map