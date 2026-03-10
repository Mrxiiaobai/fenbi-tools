// import { webview } from "./../api/webview";
// import * as vscode from "vscode";
// import { globalState } from "../utils/globalState";
// export const openContentCommand = vscode.commands.registerCommand(
//   "fenbitreeView.openContent",
//   async (treeItem: vscode.TreeItem) => {
//     if (treeItem.label) {
//       const activeKey = globalState.getState("activeItem")?.activeKey;
//       if (activeKey === treeItem.label) return;
//       const webviewPanel = globalState.getState("webviewPanel");
//       const context = globalState.getState("context");
//       if (!webviewPanel) {
//         const webviewPanel = webview.init(
//           context.extensionPath,
//           "webview_weibo"
//         );
//         globalState.setState("webviewPanel", webviewPanel);
//       }
//       webview.setContent({ title: `${treeItem.label}`, id: `${treeItem.id}` });
//     }
//   }
// );
//# sourceMappingURL=openContent.js.map