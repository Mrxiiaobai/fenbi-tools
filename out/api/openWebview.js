"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webview = exports.Webview = void 0;
const vscode = require("vscode");
const base_1 = require("../utils/base");
const path = require("path");
const templateHtml = (scriptUri) => {
    return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>微博</title>
    </head>
    <body>
      <div id="root"></div>
      <script src=${scriptUri}></script>
    </body>
  </html>`;
};
class Webview {
    init(extensionPath, webviewId, webviewTitle) {
        this.panel = vscode.window.createWebviewPanel(webviewId, webviewTitle || "详情", vscode.ViewColumn.One, {
            enableScripts: true,
        });
        const scriptPath = vscode.Uri.file(path.join(extensionPath, base_1.default.jsPath));
        const scriptUri = this.panel.webview.asWebviewUri(scriptPath);
        this.panel.webview.html = templateHtml(scriptUri);
        return this.panel;
    }
    postMessage({ command, text }) {
        setTimeout(() => {
            this.panel.webview.postMessage({
                command,
                text,
            });
        }, 50);
    }
}
exports.Webview = Webview;
exports.webview = new Webview();
// export const openWebview = (extensionPath: any) => {
//   const panel = vscode.window.createWebviewPanel(
//     "your.webview.id",
//     "详情",
//     vscode.ViewColumn.One,
//     {
//       enableScripts: true,
//     }
//   );
//   const scriptPath = vscode.Uri.file(
//     path.join(extensionPath, baseConfig.jsPath)
//   );
//   const scriptUri = panel.webview.asWebviewUri(scriptPath);
//   panel.webview.html = templateHtml(scriptUri);
//   setTimeout(() => {
//     panel.webview.postMessage({
//       command: "hello",
//       text: "Hello from extension!",
//     });
//   }, 3000);
// };
//# sourceMappingURL=openWebview.js.map