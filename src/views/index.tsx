import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { App } from "./app";
import "./style/theme.less";

const rootDiv = document.createElement("div");
rootDiv.id = "root";
document.body.appendChild(rootDiv);

const loadingDiv = document.getElementById("loading");

if (loadingDiv) {
  loadingDiv.style.display = "none";
}

const root = ReactDOM.createRoot(rootDiv as HTMLElement);

root.render(
  <React.Fragment>
    <App />
  </React.Fragment>
);
