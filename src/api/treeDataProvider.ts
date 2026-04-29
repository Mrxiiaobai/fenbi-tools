import * as vscode from "vscode";
import { CATEGORIESENUM, categoryMap } from "../utils/constant";

export class CustomTreeDataProvider
  implements vscode.TreeDataProvider<CustomItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    CustomItem | undefined | null | void
  > = new vscode.EventEmitter<CustomItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    CustomItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  getTreeItem(element: CustomItem): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(element.label || "");
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

  getParent(_element: CustomItem): vscode.ProviderResult<CustomItem> {
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
