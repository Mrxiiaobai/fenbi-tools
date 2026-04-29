import * as vscode from "vscode";
import * as path from "path";
import { mainConfig } from "../config";
import { CategoryNode } from "../shared/types";

export const interval = () => {
  let timerId: NodeJS.Timeout | null = null;

  function start(callback: () => void, delay: number) {
    stop(); // 停止之前的计时器

    timerId = setInterval(callback, delay * 60000);
    return timerId;
  }

  function stop() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  return { start, stop };
};

export const runInterval = interval();

export const getScriptPath = (extensionPath: string) => {
  const scriptPath = vscode.Uri.file(
    path.join(extensionPath, mainConfig.jsPath)
  );
  return scriptPath;
};

export const templateHtml = (scriptUri: vscode.Uri) => {
  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>详情</title>
    </head>
    <body>
      <div id="loading">页面初始化中...</div>
      <div id="root"></div>
      <script src=${scriptUri}></script>
    </body>
  </html>`;
};

export const getScriptUri = (
  webview: vscode.WebviewView,
  scriptPath: vscode.Uri
) => {
  const scriptUri = webview.webview.asWebviewUri(scriptPath);
  return scriptUri;
};

export const modifyArray = (
  arr: CategoryNode[],
  cacheKey: Array<number | string>,
  level = 1,
) => {
  return arr.map((item) => {
    // 修改属性名
    const newItem = {
      ...item,
      key: item.id,
      label: `${item.name} (${item.answerCount}/${item.count})`,
    };

    if (level > 1) {
      newItem.label = `${item.name} (${item.answerCount}/${item.count}) ${
        cacheKey?.includes(item.id) ? "【继续答题】" : ""
      }`;
    }

    // 检查是否有子项
    if (item.children) {
      // 如果是第二级（level === 2），添加 "全部" 选项
      if (level === 1) {
        const allOption = {
          ...item,
          key: item.id, // 使用父级 key 作为 "全部" 选项的 key
          label: `全部 ${
            cacheKey?.includes(item.id) && cacheKey?.length == 1
              ? "【继续答题】"
              : ""
          }`,
          children: null,
        };
        // 递归处理子项，并在第二级添加 "全部"
        newItem.children = [
          allOption,
          ...modifyArray(item.children, cacheKey, level + 1),
        ];
      } else {
        // 递归处理子项，递增级别
        newItem.children = modifyArray(item.children, cacheKey, level + 1);
      }
    }

    return newItem;
  });
};
