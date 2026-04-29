import * as vscode from "vscode";

export const onDidChangeConfigurationCommand = (
  callback: () => void | Promise<void>,
) => {
  return vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration("fenbiTools")) {
      const updated = vscode.workspace.getConfiguration("fenbiTools");
      if (updated) {
        callback && callback();
      }
    }
  });
};
