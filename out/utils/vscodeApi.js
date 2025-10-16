"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVscodeApi = void 0;
let vscode = null;
const getVscodeApi = () => {
    if (!vscode) {
        vscode = acquireVsCodeApi();
    }
    return vscode;
};
exports.getVscodeApi = getVscodeApi;
//# sourceMappingURL=vscodeApi.js.map