import * as http from "http";
import * as https from "https";
import * as tls from "tls";
import { createHash } from "crypto";
import * as vscode from "vscode";
import {
  FenbiUserInfoResponse,
  LeaderboardPayload,
  LeaderboardResult,
  LeaderboardSort,
} from "../shared/types";
import { getUserInfo } from "./service";

const DEFAULT_API_URL = "https://qipai.work/fenbi-api";

export const hashLeaderboardId = (value: string) => {
  return createHash("sha256").update(value).digest("hex");
};

export const parseLeaderboardUser = (response: FenbiUserInfoResponse) => {
  const profile = response.data || response;
  const id = profile.id ?? profile.userId;
  const nickname = profile.nickname?.trim();
  if (id === undefined || id === null || String(id) === "" || !nickname) {
    throw new Error("无法获取粉笔用户 ID 或昵称，请检查 Cookie 后重试");
  }
  return { userId: hashLeaderboardId(`fenbi:${id}`), nickname };
};

const request = <T>(path: string, body?: unknown): Promise<T> => {
  const configured = vscode.workspace.getConfiguration("fenbiTools")
    .get<string>("leaderboardApiUrl", DEFAULT_API_URL).trim();
  const base = (configured || DEFAULT_API_URL).replace(/\/+$/, "");
  const url = new URL(`${base}${path}`);
  if (url.protocol !== "https:" && !(url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))) {
    return Promise.reject(new Error("排行榜地址必须使用 HTTPS，本地联调可使用 HTTP"));
  }
  const payload = body === undefined ? undefined : JSON.stringify(body);
  // This service receives statistics only. Fenbi cookies stay on Fenbi requests.
  const send = (withoutSni = false): Promise<T> => new Promise<T>((resolve, reject) => {
    let tlsEstablished = false;
    const req = (url.protocol === "https:" ? https : http).request(url, {
      method: payload === undefined ? "GET" : "POST",
      ...(withoutSni ? {
        servername: "",
        checkServerIdentity: (_hostname: string, certificate: tls.PeerCertificate) =>
          tls.checkServerIdentity(url.hostname, certificate),
      } : {}),
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        ...(payload === undefined ? {} : { "Content-Length": Buffer.byteLength(payload) }),
      },
    }, (res) => {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (chunk: string) => {
        data += chunk;
        if (data.length > 1024 * 1024) req.destroy(new Error("排行榜响应过大"));
      });
      res.on("error", reject);
      res.on("end", () => {
        try {
          const result = JSON.parse(data) as { code: number; data: T; message?: string };
          if (res.statusCode !== 200 || result.code !== 0) {
            reject(new Error(result.message || `排行榜请求失败：HTTP ${res.statusCode}`));
            return;
          }
          resolve(result.data);
        } catch (_error) {
          reject(new Error("排行榜服务响应异常，请检查服务地址"));
        }
      });
    });
    req.on("socket", (socket) => {
      if (url.protocol !== "https:") return;
      const secureSocket = socket as tls.TLSSocket;
      tlsEstablished = secureSocket.authorized;
      secureSocket.once("secureConnect", () => { tlsEstablished = true; });
    });
    req.setTimeout(10000, () => req.destroy(new Error("排行榜请求超时，请稍后重试")));
    req.on("error", (error: NodeJS.ErrnoException) => {
      // Some networks reset this host's SNI handshake. Keep certificate and hostname verification on retry.
      if (!withoutSni && !tlsEstablished && url.protocol === "https:" &&
          url.hostname === "qipai.work" && error.code === "ECONNRESET") {
        send(true).then(resolve, reject);
        return;
      }
      if (url.protocol === "https:" && ["ECONNRESET", "EPROTO"].includes(error.code)) {
        reject(new Error(`排行榜 HTTPS 连接被中断（${url.origin}），请检查服务是否已部署及 HTTPS 配置`));
        return;
      }
      if (error.code === "ECONNREFUSED") {
        reject(new Error(`无法连接排行榜服务 ${url.origin}，请确认服务已启动及地址设置正确`));
        return;
      }
      reject(new Error(`排行榜服务 ${url.origin} 请求失败：${error.message}`));
    });
    if (payload !== undefined) req.write(payload);
    req.end();
  });
  return send();
};

export const fetchLeaderboard = async (
  sort: LeaderboardSort = "quantity", page = 1,
) => {
  const query = new URLSearchParams({ sort, page: String(page), pageSize: "50" });
  try {
    const user = parseLeaderboardUser(await getUserInfo());
    query.set("userId", user.userId);
  } catch (_error) {
    // Reading the public leaderboard does not require a Fenbi login.
  }
  return request<LeaderboardPayload>(`/leaderboard?${query.toString()}`);
};

export const uploadLeaderboardResult = async (result: LeaderboardResult) => {
  const user = parseLeaderboardUser(await getUserInfo());
  return request<{ date: string; duplicate: boolean }>("/results", {
    ...user,
    ...result,
    winRate: result.correctCount / result.questionCount,
  });
};
