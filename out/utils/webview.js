"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webview = exports.Webview = void 0;
const vscode = require("vscode");
const func_1 = require("./func");
// import { getHotDetail } from "./service";
const config_1 = require("../config");
const path = require("path");
class Webview {
    setWebviewHtml(extensionPath) {
        const scriptPath = vscode.Uri.file(path.join(extensionPath, config_1.mainConfig.jsPath));
        const scriptUri = this.panel.webview.asWebviewUri(scriptPath);
        this.panel.webview.html = (0, func_1.templateHtml)(scriptUri);
    }
    createSideInit(webviewView, extensionPath) {
        this.panel = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
        };
        this.setWebviewHtml(extensionPath);
        // this.onDidChangeVisibility(() => {
        //   console.log("webviewView.onDidChangeVisibility", webviewView.visible);
        // });
        return webviewView;
    }
    onDidChangeVisibility(callback) {
        this.panel.onDidChangeVisibility(callback);
    }
    onDidDispose(callback) {
        this.panel.onDidDispose(callback);
    }
    onDidReceiveMessage(callback) {
        this.panel.webview.onDidReceiveMessage(callback);
    }
    createInit(extensionPath, webviewId, webviewTitle) {
        this.panel = vscode.window.createWebviewPanel(webviewId, webviewTitle || "详情", vscode.ViewColumn.One, {
            enableScripts: true,
        });
        this.setWebviewHtml(extensionPath);
        return this.panel;
    }
    postMessage({ command, data }) {
        setTimeout(() => {
            this.panel.webview.postMessage({
                command,
                data,
            });
        }, 50);
    }
}
exports.Webview = Webview;
exports.webview = new Webview();
//# sourceMappingURL=webview.js.map