import * as vscode from "vscode";
import { onDidChangeConfigurationCommand } from "../commands/onDidChangeConfiguration";
import { runInterval } from "../utils/func";
import { globalState } from "../utils/globalState";

export const init = (customTreeDataProvider: any) => {
  const config = vscode.workspace.getConfiguration("fenbiTools");

  const onRefresh = () => {
    customTreeDataProvider.refresh();
  };

  vscode.commands.registerCommand("openFenbiWebview.refreshEntry", () => {
    onRefresh();
  });

  const context = globalState.getState("context");
  context.subscriptions.push(
    // 监听配置变化
    onDidChangeConfigurationCommand(() => {
      const config = vscode.workspace.getConfiguration("fenbiTools");
      runInterval.start(onRefresh, config.interval || 30);
    })
  );
};
