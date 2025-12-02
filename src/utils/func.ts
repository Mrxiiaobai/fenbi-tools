import * as vscode from "vscode";
import { globalState } from "./globalState";
import { mainConfig } from "../config";

const cheerio = require("cheerio");
const path = require("path");

export const interval = () => {
  let timerId: any = null;

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

const getContent = ($: any, element: any) => {
  let content = "";
  const childElements = $(element).contents();
  childElements.each(
    (childIndex: any, childElement: { nodeType: number; tagName: string }) => {
      if (childElement.nodeType === 3) {
        // 文本节点
        content += $(childElement).text();
      } else if (childElement.tagName === "a") {
        // a标签节点
        content += $(childElement).text();
      }
    }
  );
  return content;
};

export const analyze = (htmlContent: string) => {
  const $ = cheerio.load(htmlContent);
  const containerElement = $("div.woo-box-flex");

  if (!containerElement || !htmlContent) {
    vscode.window.showInformationMessage("cookie过期，请重新设置cookie");
    return;
  }
  const listItem = $(containerElement).find(
    'div[action-type="feed_list_item"]'
  );

  const topicElement = $(containerElement).find("div.card-topic-lead");

  let arr: any[] = [];

  listItem.each((index: any, element: any) => {
    const nickName = $(element).find("a.name").text().trim();

    let descriptions = "";
    let content = "";

    const descriptionElements =
      $($(element).find("div.from")?.[0]).find("a") || [];

    const contentElements =
      $($(element).find("p[node-type=feed_list_content]")?.[0]) || [];

    const contentFullElements =
      $($(element).find("p[node-type=feed_list_content_full]")?.[0]) || [];

    const forwardElement = $(element).find(
      "a[action-type=feed_list_forward]"
    )?.[0];

    const commentElement = $(element).find(
      "a[action-type=feed_list_comment]"
    )?.[0];
    const likeElement = $(element).find("a[action-type=feed_list_like]")?.[0];

    if (contentFullElements.length > 0) {
      content = getContent($, contentFullElements);
    } else {
      content = getContent($, contentElements);
    }

    descriptionElements.each((index: any, element: any) => {
      descriptions += $(element)?.text()?.trim() + "  ";
    });

    const forward = $(forwardElement)?.text()?.trim() || 0;
    const comment = $(commentElement)?.text()?.trim() || 0;
    const like = $(likeElement)?.text()?.trim() || 0;

    arr.push({
      nickName,
      descriptions,
      content,
      forward,
      comment,
      like,
    });
  });

  const topic = $(topicElement)?.text()?.trim();

  return {
    topic,
    data: arr,
  };
};

export const getScriptPath = (extensionPath: string) => {
  const scriptPath = vscode.Uri.file(
    path.join(extensionPath, mainConfig.jsPath)
  );
  return scriptPath;
};

export const templateHtml = (scriptUri: any) => {
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

export const modifyArray = (arr: any[], cacheKey: number[], level = 1) => {
  return arr.map((item: any) => {
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

/**
 * 根据 cards 的顺序，生成一个 materialsForRender 数组
 * 让 materialsForRender[index] === 当前题目的展示图片（仅首次出现时才有）
 */
export const buildMaterialsForQuestions = (cards: any, materials: any[]) => {
  // 方便快速查询 globalId → content
  const materialContentMap = new Map(
    materials.map((m) => [m.globalId, m.content])
  );

  const usedMaterialKeys = new Set(); // 已经展示过的素材
  const materialsForRender: any[] = []; // 最终用于页面渲染的 materials[index]

  const questions = cards?.children[0].children; // 题目顺序数组

  questions.forEach((q: { materialKeys: any }, index: number) => {
    const keys = q.materialKeys;

    if (!keys || keys.length === 0) {
      materialsForRender[index] = null;
      return;
    }

    const key = keys[0];

    // 第一次出现 → 允许展示图片
    if (!usedMaterialKeys.has(key)) {
      usedMaterialKeys.add(key);

      materialsForRender[index] = {
        key,
        content: materialContentMap.get(key) || null,
      };
    } else {
      // 后续重复出现 → 不展示图
      materialsForRender[index] = null;
    }
  });

  return materialsForRender;
};
