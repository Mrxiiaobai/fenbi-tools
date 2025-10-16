import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { App } from "./app";
import "./style/theme.less";

// 创建 root 节点
const rootDiv = document.createElement("div");
rootDiv.id = "root";
document.body.appendChild(rootDiv);

// 隐藏 loading
const loadingDiv = document.getElementById("loading");
if (loadingDiv) loadingDiv.style.display = "none";

// 渲染
const root = ReactDOM.createRoot(rootDiv);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
