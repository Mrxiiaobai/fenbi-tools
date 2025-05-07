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
exports.activate = void 0;
const vscode = require("vscode");
const webview_1 = require("./utils/webview");
const webviewHandle_1 = require("./api/webviewHandle");
function activate(context) {
    const provider = new MyWebviewProvider(context);
    vscode.commands.registerCommand("openFenbiWebview.refreshEntry", () => {
        const config = vscode.workspace.getConfiguration("fenbiTools");
        webview_1.webview.postMessage({
            command: "setting",
            data: config,
        });
    });
    context.subscriptions.push(vscode.window.registerWebviewViewProvider("openFenbiWebview", provider));
}
exports.activate = activate;
class MyWebviewProvider {
    constructor(context) {
        this._context = context;
    }
    resolveWebviewView(webviewView) {
        return __awaiter(this, void 0, void 0, function* () {
            webview_1.webview.createSideInit(webviewView, this._context.extensionPath);
            new webviewHandle_1.default().onDidReceiveMessage();
        });
    }
}
//# sourceMappingURL=extension.js.map