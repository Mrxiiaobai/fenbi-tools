import * as vscode from "vscode";
const https = require("https");

const isJSON = (data: any) => {
  try {
    JSON.parse(data);
    return true;
  } catch (error) {
    return false;
  }
};

const ajax = (
  methods: "POST" | "GET" | "FORM",
  url: string,
  params?: any,
  headers?: any
) => {
  const parsedUrl = new URL(url);
  const config = vscode.workspace.getConfiguration("fenbiTools");
  if (!config.cookie) {
    vscode.window.showErrorMessage("未设置 cookie");
    return;
  }

  const options = {
    method: "GET",
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || 443, // 如果 URL 中没有指定端口号，默认为 443
    path: parsedUrl.pathname + parsedUrl.search,
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      Cookie: config.cookie,
      ...headers,
    },
  };
  if (methods) options.method = methods == "FORM" ? "POST" : methods;
  return new Promise<any>((resolve, reject) => {
    const req = https.request(options, (res: any) => {
      let data = "";
      res.on("data", (chunk: string) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const result = isJSON(data) ? JSON.parse(data) : data;
          resolve(result);
        } catch (err) {
          console.error(err);
          vscode.window.showErrorMessage(`${err}`);
        }
      });
    });

    req.on("error", (error: any) => {
      reject(error);
      vscode.window.showErrorMessage(`${error}`);
    });

    if (methods === "POST") {
      req.write(JSON.stringify(params));
    }
    if (methods === "FORM") {
      req.write(toUrlEncoded(params));
    }
    req.end();
  });
};

// 将 params 转换为表单格式的辅助函数
const toUrlEncoded = (obj: any) => {
  return Object.keys(obj)
    .map((key) => encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]))
    .join("&");
};

export default ajax;
