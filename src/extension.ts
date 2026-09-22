import * as vscode from "vscode";
import { webview } from "./utils/webview";
import WebviewHandle from "./api/webviewHandle";

export function activate(context: vscode.ExtensionContext) {
  const provider = new MyWebviewProvider(context);

  context.subscriptions.push(
    vscode.commands.registerCommand("openFenbiWebview.refreshEntry", () => {
      const config = vscode.workspace.getConfiguration("fenbiTools");
      webview.postMessage({
        command: "setting",
        data: config,
      });
    }),
    vscode.commands.registerCommand("openFenbiWebview.toggleDisguise", () => {
      webview.postMessage({
        command: "showDisguise",
        data: null,
      });
    }),
    vscode.window.registerWebviewViewProvider("openFenbiWebview", provider, {
      webviewOptions: {
        retainContextWhenHidden: true,
      },
    })
  );
}

class MyWebviewProvider implements vscode.WebviewViewProvider {
  private _context: vscode.ExtensionContext;
  private _messageDisposable?: vscode.Disposable;

  constructor(context: vscode.ExtensionContext) {
    this._context = context;
  }

  async resolveWebviewView(webviewView: vscode.WebviewView) {
    webview.createSideInit(webviewView, this._context.extensionPath);

    this._messageDisposable?.dispose();
    this._messageDisposable = new WebviewHandle().onDidReceiveMessage();
    this._context.subscriptions.push(this._messageDisposable);
  }
}
