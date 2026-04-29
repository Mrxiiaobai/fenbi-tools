import * as vscode from "vscode";

interface GlobalStateShape {
  activeItem: {
    activeKey: string;
    activeTitle: string;
  };
  context: vscode.ExtensionContext | null;
  webviewPanel: vscode.WebviewPanel | vscode.WebviewView | null;
  jsPath: string;
}

class GlobalState {
  private state: GlobalStateShape;

  public constructor() {
    // 初始化状态
    this.state = this.initializeState();
  }

  private initializeState(): GlobalStateShape {
    // 初始化变量，将其添加到 state 对象中
    return {
      activeItem: {
        activeKey: "",
        activeTitle: "",
      },
      context: null,
      webviewPanel: null,
      jsPath: "out/views/fenbi.js",
    };
  }

  public getState<K extends keyof GlobalStateShape>(
    key: K,
  ): GlobalStateShape[K] {
    // 获取指定键对应的状态值
    return this.state[key];
  }

  public setState<K extends keyof GlobalStateShape>(
    key: K,
    value: GlobalStateShape[K],
  ): void {
    // 更新指定键对应的状态值
    this.state[key] = value;
  }
}

export const globalState = new GlobalState();
