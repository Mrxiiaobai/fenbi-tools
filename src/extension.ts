import * as vscode from "vscode";
import { webview } from "./utils/webview";
import WebviewHandle from "./api/webviewHandle";
import { sidebarActions, SidebarAction } from "./shared/types";

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
    ...sidebarActions.map((action) => vscode.commands.registerCommand(
      `openFenbiWebview.${action}`, () => provider.runAction(action),
    )),
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
  private view?: vscode.WebviewView;

  constructor(context: vscode.ExtensionContext) {
    this._context = context;
  }

  runAction(action: SidebarAction) {
    if (this.view?.visible) return this.view.webview.postMessage({ action });
  }

  async resolveWebviewView(webviewView: vscode.WebviewView) {
    this.view = webviewView;
    const resetShortcuts = () => {
      for (const action of sidebarActions) {
        void vscode.commands.executeCommand("setContext", `fenbiTools.${action}Available`, false);
      }
    };
    this._context.subscriptions.push(
      webviewView.onDidChangeVisibility(() => {
        if (!webviewView.visible) resetShortcuts();
      }),
      webviewView.onDidDispose(() => {
        this.view = undefined;
        resetShortcuts();
      }),
    );
    webview.createSideInit(webviewView, this._context.extensionPath);

    this._messageDisposable?.dispose();
    this._messageDisposable = new WebviewHandle().onDidReceiveMessage();
    this._context.subscriptions.push(this._messageDisposable);
  }
}
