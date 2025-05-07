import * as vscode from "vscode";
import { getCategories } from "../utils/service";
import { webview } from "../utils/webview";
import { globalState } from "../utils/globalState";
import { analyze } from "../utils/func";
import { CATEGORIESENUM, categoryMap } from "../utils/constant";

// const initData = await getCategories();

export class CustomTreeDataProvider
  implements vscode.TreeDataProvider<CustomItem>
{
  resolveTreeItem?(
    item: vscode.TreeItem,
    element: CustomItem,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.TreeItem> {
    throw new Error("Method not implemented.");
  }

  private _onDidChangeTreeData: vscode.EventEmitter<
    CustomItem | undefined | null | void
  > = new vscode.EventEmitter<CustomItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    CustomItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  getTreeItem(element: CustomItem): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(element?.label as any);
    // 配置点击行为
    if (!element.isCategory) {
      treeItem.command = {
        command: "treeView.openContent",
        title: "Open Content",
        arguments: [element],
      };
    }

    treeItem.collapsibleState = element.isCategory
      ? element.collapsibleState
      : vscode.TreeItemCollapsibleState.None;

    return treeItem;
  }

  getParent(element: CustomItem): vscode.ProviderResult<CustomItem> {
    // if (!element) {
    //   return undefined;
    // }

    return undefined;
  }

  async getChildren(element?: CustomItem): Promise<CustomItem[]> {
    if (!element) {
      // 根节点时返回分类节点
      return Promise.resolve([
        new CustomItem(
          categoryMap[CATEGORIESENUM.CHOOSE_CATE],
          CATEGORIESENUM.CHOOSE_CATE,
          true,
          vscode.TreeItemCollapsibleState.Expanded
        ),
        new CustomItem(
          categoryMap[CATEGORIESENUM.ANSWER_QUESTION],
          CATEGORIESENUM.ANSWER_QUESTION,
          true
        ),
      ]);
    }

    // const categoryData = {
    //   [CATEGORIESENUM.HOT]: getHotSearch,
    //   [CATEGORIESENUM.ENTERTAINMENT]: getWyHot,
    //   [CATEGORIESENUM.NEWS]: getNews,
    // } as { [key: string]: () => Promise<any> };
    // const res = await categoryData[element.id || CATEGORIESENUM.HOT]();

    // if (res.code == -1) {
    //   vscode.window.showInformationMessage(`该类别需要设置cookie`);
    //   return Promise.resolve([]);
    // }
    // if ((res?.data || []).length <= 0) return Promise.resolve([]);

    // const customeTree = (res.data || []).map(
    //   (item: { label: string; id: string }) => {
    //     return new CustomItem(item?.label, item?.id);
    //   }
    // );

    // const context = globalState.getState("context");
    // const panel = webview.init(context.extensionPath, "webview_weibo");
    // webview.setContent({
    //   title: `${res.data?.[0].label}`,
    //   id: res.data?.[0].id,
    // });
    // globalState.setState("webviewPanel", panel);
    // vscode.window.showInformationMessage(`最新热搜：${res.data[0]?.label}`);

    return Promise.resolve([]);
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
}

class CustomItem extends vscode.TreeItem {
  public isCategory: boolean = false;
  constructor(
    label: string,
    id: string,
    isCategory: boolean = false,
    defaultCollapsibleState: vscode.TreeItemCollapsibleState = vscode
      .TreeItemCollapsibleState.Collapsed
  ) {
    super(label, defaultCollapsibleState);

    this.id = id;
    this.isCategory = isCategory;
    this.collapsibleState = defaultCollapsibleState;
  }
}
