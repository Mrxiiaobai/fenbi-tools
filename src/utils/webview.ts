import * as vscode from "vscode";
import * as path from "path";
import { templateHtml } from "./func";
import { mainConfig } from "../config";
import { WebviewRequestMessage } from "../shared/types";

type WebviewPanelLike = vscode.WebviewView | vscode.WebviewPanel;

export class Webview {
  private panel?: WebviewPanelLike;

  private getPanel() {
    if (!this.panel) {
      throw new Error("Webview has not been initialized");
    }

    return this.panel;
  }

  setWebviewHtml(extensionPath: string) {
    const scriptPath = vscode.Uri.file(
      path.join(extensionPath, mainConfig.jsPath)
    );

    const panel = this.getPanel();
    const scriptUri = panel.webview.asWebviewUri(scriptPath);
    panel.webview.html = templateHtml(scriptUri);
  }

  createSideInit(webviewView: vscode.WebviewView, extensionPath: string) {
    this.panel = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
    };

    this.setWebviewHtml(extensionPath);

    return webviewView;
  }

  onDidChangeVisibility(callback: () => void) {
    const panel = this.getPanel();
    if ("onDidChangeVisibility" in panel) {
      panel.onDidChangeVisibility(callback);
    }
  }

  onDidDispose(callback: () => void) {
    this.getPanel().onDidDispose(callback);
  }

  onDidReceiveMessage(callback: (message: WebviewRequestMessage) => void) {
    return this.getPanel().webview.onDidReceiveMessage(callback);
  }

  createInit(extensionPath: string, webviewId: string, webviewTitle?: string) {
    this.panel = vscode.window.createWebviewPanel(
      webviewId,
      webviewTitle || "详情",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
      }
    );

    this.setWebviewHtml(extensionPath);

    return this.panel;
  }

  postMessage({ command, data }: { command: string; data: unknown }) {
    setTimeout(() => {
      this.getPanel().webview.postMessage({
        command,
        data,
      });
    }, 50);
  }
}

export const webview = new Webview();
