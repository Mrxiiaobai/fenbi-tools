import * as vscode from "vscode";
import * as https from "https";
import { RequestMethod } from "../shared/types";

export class FenbiRequestError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;

  constructor(message: string, code = "REQUEST_ERROR", statusCode?: number) {
    super(message);
    this.name = "FenbiRequestError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

const parseResponseBody = (data: string): unknown => {
  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch (_error) {
    return data;
  }
};

const ajax = <TResponse = unknown>(
  methods: RequestMethod,
  url: string,
  params?: unknown,
  headers?: Record<string, string>,
): Promise<TResponse> => {
  const parsedUrl = new URL(url);
  const config = vscode.workspace.getConfiguration("fenbiTools");
  if (!config.cookie) {
    const error = new FenbiRequestError("未设置 cookie", "MISSING_COOKIE");
    vscode.window.showErrorMessage(error.message);
    return Promise.reject(error);
  }

  const options: {
    method: RequestMethod;
    hostname: string;
    port: string | number;
    path: string;
    headers: Record<string, string>;
  } = {
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
  return new Promise<TResponse>((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk: string) => {
        data += chunk;
      });
      res.on("end", () => {
        const result = parseResponseBody(data);
        const statusCode = res.statusCode || 0;

        if (statusCode < 200 || statusCode >= 300) {
          const error = new FenbiRequestError(
            `请求失败：HTTP ${statusCode}`,
            "HTTP_ERROR",
            statusCode,
          );
          vscode.window.showErrorMessage(error.message);
          reject(error);
          return;
        }

        resolve(result as TResponse);
      });
    });

    req.setTimeout(15000, () => {
      req.destroy(new FenbiRequestError("请求超时", "TIMEOUT"));
    });

    req.on("error", (error: Error) => {
      const requestError =
        error instanceof FenbiRequestError
          ? error
          : new FenbiRequestError(error.message, "NETWORK_ERROR");
      reject(requestError);
      vscode.window.showErrorMessage(requestError.message);
    });

    if (methods === "POST" || methods === "PUT") {
      const body = JSON.stringify(params);
      req.setHeader("Content-Length", Buffer.byteLength(body));
      req.write(body);
    }
    if (methods === "FORM") {
      const body = toUrlEncoded(params);
      req.setHeader("Content-Length", Buffer.byteLength(body));
      req.write(body);
    }
    req.end();
  });
};

// 将 params 转换为表单格式的辅助函数
const toUrlEncoded = (obj: unknown) => {
  if (!obj || typeof obj !== "object") return "";

  return Object.keys(obj)
    .map((key) => {
      const value = (obj as Record<string, unknown>)[key];
      return encodeURIComponent(key) + "=" + encodeURIComponent(String(value));
    })
    .join("&");
};

export default ajax;
