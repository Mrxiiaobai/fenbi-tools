import * as vscode from "vscode";
import { webview } from "./utils/webview";
import WebviewHandle from "./api/webviewHandle";

export function activate(context: vscode.ExtensionContext) {
  const provider = new MyWebviewProvider(context);

  vscode.commands.registerCommand("openFenbiWebview.refreshEntry", () => {
    const config = vscode.workspace.getConfiguration("fenbiTools");
    webview.postMessage({
      command: "setting",
      data: config,
    });
  });

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("openFenbiWebview", provider)
  );
}

class MyWebviewProvider implements vscode.WebviewViewProvider {
  private _context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this._context = context;
  }

  async resolveWebviewView(webviewView: vscode.WebviewView) {
    webview.createSideInit(webviewView, this._context.extensionPath);

    new WebviewHandle().onDidReceiveMessage();
  }
}
