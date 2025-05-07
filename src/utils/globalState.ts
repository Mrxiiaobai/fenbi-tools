class GlobalState {
  private state: { [key: string]: any } = {};

  public constructor() {
    // 初始化状态
    this.initializeState();
  }

  private initializeState(): void {
    // 初始化变量，将其添加到 state 对象中
    this.state = {
      activeItem: {
        activeKey: "",
        activeTitle: "",
      },
      context: null,
      webviewPanel: null,
      jsPath: "out/views/fenbi.js",
    };
  }

  public getState(key: string): any {
    // 获取指定键对应的状态值
    return this.state[key];
  }

  public setState(key: string, value: any): void {
    // 更新指定键对应的状态值
    this.state[key] = value;
  }
}

export const globalState = new GlobalState();
