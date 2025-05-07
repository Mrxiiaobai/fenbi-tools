"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalState = void 0;
class GlobalState {
    constructor() {
        this.state = {};
        // 初始化状态
        this.initializeState();
    }
    initializeState() {
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
    getState(key) {
        // 获取指定键对应的状态值
        return this.state[key];
    }
    setState(key, value) {
        // 更新指定键对应的状态值
        this.state[key] = value;
    }
}
exports.globalState = new GlobalState();
//# sourceMappingURL=globalState.js.map