"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const https = require("https");
const isJSON = (data) => {
    try {
        JSON.parse(data);
        return true;
    }
    catch (error) {
        return false;
    }
};
const ajax = (methods, url, params, headers) => {
    const parsedUrl = new URL(url);
    const config = vscode.workspace.getConfiguration("fenbiTools");
    if (!config.cookie) {
        vscode.window.showErrorMessage("未设置 cookie");
        return;
    }
    const options = {
        method: "GET",
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname + parsedUrl.search,
        headers: Object.assign({ "Content-Type": "application/json;charset=UTF-8", Cookie: config.cookie }, headers),
    };
    if (methods)
        options.method = methods == "FORM" ? "POST" : methods;
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => {
                data += chunk;
            });
            res.on("end", () => {
                try {
                    const result = isJSON(data) ? JSON.parse(data) : data;
                    resolve(result);
                }
                catch (err) {
                    console.error(err);
                    vscode.window.showErrorMessage(`${err}`);
                }
            });
        });
        req.on("error", (error) => {
            reject(error);
            vscode.window.showErrorMessage(`${error}`);
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
const toUrlEncoded = (obj) => {
    return Object.keys(obj)
        .map((key) => encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]))
        .join("&");
};
exports.default = ajax;
//# sourceMappingURL=request.js.map