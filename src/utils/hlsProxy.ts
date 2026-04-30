/* eslint-disable no-console */
import * as http from "http";
import * as https from "https";
import * as crypto from "crypto";
import * as vscode from "vscode";

const ALLOWED_HOSTS = new Set([
  "live.fenbi.com",
  "hlsfiletxv5.fbstatic.cn",
  "vod.fbstatic.cn",
]);

let serverPromise: Promise<{ port: number }> | undefined;

type ProxyDecryptMode = "server" | "browser";

interface SegmentCryptoInfo {
  keyUrl: string;
  iv: Buffer;
}

interface PlaylistCryptoInfo {
  keyUrl: string;
  iv?: Buffer;
}

const segmentCryptoInfoByUrl = new Map<string, SegmentCryptoInfo>();
const keyCacheByUrl = new Map<string, Buffer>();

const debugLog = (message: string, data?: unknown) => {
  if (data === undefined) {
    console.log(`[FenbiTools:HLSProxy] ${message}`);
    return;
  }
  console.log(`[FenbiTools:HLSProxy] ${message}`, data);
};

const isAllowedTarget = (url: URL) => {
  return url.protocol === "https:" && ALLOWED_HOSTS.has(url.hostname);
};

const getCookieHeader = (url: URL) => {
  if (!url.hostname.endsWith(".fenbi.com")) return undefined;

  const config = vscode.workspace.getConfiguration("fenbiTools");
  return typeof config.cookie === "string" && config.cookie
    ? config.cookie
    : undefined;
};

const createProxyUrl = (
  port: number,
  targetUrl: string,
  decryptMode: ProxyDecryptMode = "server",
) => {
  const params = new URLSearchParams({ url: targetUrl });
  if (decryptMode !== "server") {
    params.set("decrypt", decryptMode);
  }
  return `http://127.0.0.1:${port}/hls-proxy?${params.toString()}`;
};

const createPlayerUrl = (port: number, targetUrl: string) => {
  return `http://127.0.0.1:${port}/hls-player?url=${encodeURIComponent(
    targetUrl,
  )}`;
};

const getTargetKind = (targetUrl: string) => {
  if (/\/key\?/i.test(targetUrl)) return "key";
  if (/\.ts(\?|$)/i.test(targetUrl)) return "segment";
  if (/m3u8/i.test(targetUrl)) return "playlist";
  return "resource";
};

const createPlayerHtml = (
  originalUrl: string,
  proxyUrl: string,
  browserDecryptProxyUrl: string,
) => {
  const originalJson = JSON.stringify(originalUrl);
  const proxyJson = JSON.stringify(proxyUrl);
  const browserDecryptProxyJson = JSON.stringify(browserDecryptProxyUrl);
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>示范作答</title>
  <style>
    html, body { margin: 0; height: 100%; background: #101114; color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    main { box-sizing: border-box; min-height: 100%; padding: 24px; display: flex; flex-direction: column; gap: 12px; }
    video { width: 100%; max-height: calc(100vh - 120px); background: #000; border-radius: 8px; }
    pre { white-space: pre-wrap; word-break: break-all; color: #c9c9c9; font-size: 12px; }
  </style>
</head>
<body>
  <main>
    <video id="video" controls autoplay playsinline></video>
    <pre id="status">loading...</pre>
  </main>
  <script src="https://web.sdk.qcloud.com/player/tcplayer/release/v4.9.1/libs/hls.min.1.1.7.js"></script>
  <script>
    const sources = [
      { name: "proxy-browser-decrypt", url: ${browserDecryptProxyJson} },
      { name: "proxy-server-decrypt", url: ${proxyJson} },
      { name: "original", url: ${originalJson} }
    ];
    const video = document.getElementById("video");
    const status = document.getElementById("status");
    let hls = null;
    let sourceIndex = 0;
    let stopped = false;
    let changingSource = false;
    const hlsConfig = {
      enableWorker: false,
      manifestLoadingMaxRetry: 0,
      levelLoadingMaxRetry: 0,
      fragLoadingMaxRetry: 0,
      keyLoadingMaxRetry: 0,
      appendErrorMaxRetry: 0
    };
    const stringify = (value) => {
      if (typeof value === "string") return value;
      const seen = new WeakSet();
      try {
        return JSON.stringify(value, (key, item) => {
          if (item instanceof Error || item instanceof DOMException) {
            return {
              name: item.name,
              message: item.message,
              code: item.code,
              stack: item.stack
            };
          }
          if (item && typeof item === "object") {
            if (seen.has(item)) return "[Circular]";
            seen.add(item);
          }
          return item;
        }, 2);
      } catch (error) {
        return String(value);
      }
    };
    const log = (...args) => {
      console.log("[FenbiTools:ExternalPlayer]", ...args);
      status.textContent = args.map(stringify).join("\\n");
    };

    const stopCurrent = () => {
      changingSource = true;
      if (hls) {
        hls.destroy();
        hls = null;
      }
      video.removeAttribute("src");
      video.load();
      setTimeout(() => {
        changingSource = false;
      }, 0);
    };

    const tryNextSource = (reason) => {
      if (stopped) return;
      if (sourceIndex >= sources.length - 1) {
        stopped = true;
        log("all sources failed", { reason, sources });
        stopCurrent();
        return;
      }
      sourceIndex += 1;
      log("try fallback source", { reason, source: sources[sourceIndex] });
      playCurrentSource();
    };

    const playCurrentSource = () => {
      stopCurrent();
      const activeSourceIndex = sourceIndex;
      const source = sources[activeSourceIndex];
      log("play source", source);

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source.url;
        return;
      }
      if (window.Hls && window.Hls.isSupported()) {
        hls = new Hls(hlsConfig);
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (stopped || sourceIndex !== activeSourceIndex) return;
          log("hls error", { source, data });
          if (data && (data.fatal || data.details === "bufferAppendError" || data.details === "fragParsingError")) {
            tryNextSource(data.details || data.type || "hls error");
          }
        });
        hls.loadSource(source.url);
        hls.attachMedia(video);
        return;
      }
      stopped = true;
      log("HLS is not supported in this browser", source);
    };

    video.addEventListener("error", () => {
      if (stopped || changingSource) return;
      const error = { code: video.error && video.error.code, message: video.error && video.error.message };
      log("video error", { source: sources[sourceIndex], error });
      tryNextSource(error.message || "video error");
    });

    playCurrentSource();
  </script>
</body>
</html>`;
};

const getBodyPreview = (body: Buffer) => {
  const firstBytes = body.subarray(0, 32);
  const text = body.toString("utf8", 0, Math.min(body.length, 180));
  return {
    bytes: body.length,
    firstBytesHex: firstBytes.toString("hex"),
    startsWithTsSyncByte: body[0] === 0x47,
    tsSync: getTsSyncInfo(body),
    textPreview: /[\u0000-\u0008\u000e-\u001f]/.test(text) ? "" : text,
  };
};

const getTsSyncInfo = (body: Buffer) => {
  let best = {
    offset: -1,
    matches: 0,
    packets: 0,
  };

  for (let offset = 0; offset < Math.min(188, body.length); offset += 1) {
    const packets = Math.floor((body.length - offset) / 188);
    if (packets <= 0) continue;

    let matches = 0;
    for (let packetIndex = 0; packetIndex < packets; packetIndex += 1) {
      if (body[offset + packetIndex * 188] === 0x47) {
        matches += 1;
      }
    }

    if (matches > best.matches) {
      best = { offset, matches, packets };
    }
  }

  return {
    offset: best.offset,
    matches: best.matches,
    packets: best.packets,
    likelyTs:
      best.offset >= 0 &&
      best.matches >= Math.min(3, best.packets) &&
      best.matches / Math.max(best.packets, 1) > 0.9,
  };
};

const parseM3u8Attributes = (line: string) => {
  const attrs: Record<string, string> = {};
  line.replace(/([A-Z0-9-]+)=("[^"]*"|[^,]*)/gi, (_match, key, rawValue) => {
    attrs[key] = String(rawValue).replace(/^"|"$/g, "");
    return "";
  });
  return attrs;
};

const parseIv = (value?: string) => {
  if (!value) return undefined;

  const normalized = value.replace(/^0x/i, "").padStart(32, "0").slice(-32);
  return Buffer.from(normalized, "hex");
};

const createMediaSequenceIv = (sequence: number) => {
  const iv = Buffer.alloc(16);
  const normalizedSequence = Number.isFinite(sequence) && sequence > 0
    ? Math.floor(sequence)
    : 0;
  const high = Math.floor(normalizedSequence / 0x100000000);
  const low = normalizedSequence >>> 0;
  iv.writeUInt32BE(high, 8);
  iv.writeUInt32BE(low, 12);
  return iv;
};

const decryptAes128Cbc = (body: Buffer, key: Buffer, iv: Buffer) => {
  const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
  return Buffer.concat([decipher.update(body), decipher.final()]);
};

const fetchTarget = (
  targetUrl: string,
  headers: http.IncomingHttpHeaders = {},
  redirectCount = 0,
): Promise<{
  statusCode: number;
  headers: http.IncomingHttpHeaders;
  body: Buffer;
  finalUrl: string;
}> => {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(targetUrl);
    if (!isAllowedTarget(parsedUrl)) {
      debugLog("blocked unsupported target", targetUrl);
      reject(new Error("Unsupported HLS target"));
      return;
    }

    const requestHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      Accept: "*/*",
      "Accept-Encoding": "identity",
      Referer: "https://spa.fenbi.com/",
      Origin: "https://spa.fenbi.com",
    };
    const cookie = getCookieHeader(parsedUrl);
    if (cookie) requestHeaders.Cookie = cookie;
    if (
      typeof headers.range === "string" &&
      !segmentCryptoInfoByUrl.has(targetUrl)
    ) {
      requestHeaders.Range = headers.range;
    }

    debugLog("fetch target", {
      targetUrl,
      range: headers.range || "",
      forwardsRange: Boolean(requestHeaders.Range),
      redirectCount,
      hasCookie: Boolean(cookie),
    });

    const req = https.request(
      {
        method: "GET",
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname + parsedUrl.search,
        headers: requestHeaders,
      },
      (res) => {
        const statusCode = res.statusCode || 0;
        const location = res.headers.location;
        debugLog("target response", {
          targetUrl,
          statusCode,
          contentType: res.headers["content-type"],
          contentLength: res.headers["content-length"],
          location,
        });
        if (
          [301, 302, 303, 307, 308].includes(statusCode) &&
          location &&
          redirectCount < 5
        ) {
          const redirectUrl = new URL(location, parsedUrl).toString();
          debugLog("follow redirect", { targetUrl, redirectUrl });
          res.resume();
          fetchTarget(redirectUrl, headers, redirectCount + 1)
            .then(resolve)
            .catch(reject);
          return;
        }

        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const body = Buffer.concat(chunks);
          debugLog("target body received", {
            targetUrl,
            kind: getTargetKind(targetUrl),
            statusCode,
            ...getBodyPreview(body),
          });
          resolve({
            statusCode,
            headers: res.headers,
            body,
            finalUrl: targetUrl,
          });
        });
      },
    );

    req.setTimeout(20000, () => {
      debugLog("target timeout", targetUrl);
      req.destroy(new Error("HLS proxy request timeout"));
    });
    req.on("error", (error) => {
      debugLog("target request error", {
        targetUrl,
        message: error.message,
      });
      reject(error);
    });
    req.end();
  });
};

const shouldRewriteAsM3u8 = (
  targetUrl: string,
  headers: http.IncomingHttpHeaders,
  body: Buffer,
) => {
  const contentType = String(headers["content-type"] || "");
  return (
    /m3u8/i.test(targetUrl) ||
    /mpegurl|application\/vnd\.apple/i.test(contentType) ||
    body.toString("utf8", 0, 16).startsWith("#EXTM3U")
  );
};

const rewriteM3u8UriAttributes = (
  line: string,
  baseUrl: URL,
  port: number,
  decryptMode: ProxyDecryptMode,
) => {
  return line.replace(/URI="([^"]+)"/g, (_match, rawUrl: string) => {
    const absoluteUrl = new URL(rawUrl, baseUrl).toString();
    return `URI="${createProxyUrl(port, absoluteUrl, decryptMode)}"`;
  });
};

const rewriteM3u8 = (
  content: string,
  targetUrl: string,
  port: number,
  decryptMode: ProxyDecryptMode,
) => {
  const baseUrl = new URL(targetUrl);
  let currentCryptoInfo: PlaylistCryptoInfo | undefined;
  let mediaSequence = 0;
  let nextSegmentSequence = 0;
  const shouldDecryptInProxy = decryptMode === "server";

  return content
    .split(/\r?\n/)
    .map((line) => {
      if (!line.trim()) return line;
      if (line.startsWith("#")) {
        if (line.startsWith("#EXT-X-MEDIA-SEQUENCE")) {
          const parsedMediaSequence = Number(line.split(":")[1]);
          if (Number.isFinite(parsedMediaSequence)) {
            mediaSequence = parsedMediaSequence;
            nextSegmentSequence = parsedMediaSequence;
            debugLog("playlist media sequence detected", {
              targetUrl,
              mediaSequence,
            });
          }
          return line;
        }
        if (line.startsWith("#EXT-X-KEY")) {
          const attrs = parseM3u8Attributes(line);
          if (attrs.METHOD === "AES-128" && attrs.URI) {
            const keyUrl = new URL(attrs.URI, baseUrl).toString();
            currentCryptoInfo = { keyUrl, iv: parseIv(attrs.IV) };
            debugLog("playlist key detected", {
              targetUrl,
              decryptMode,
              keyUrl,
              iv: currentCryptoInfo.iv?.toString("hex") || "",
              hasExplicitIv: Boolean(currentCryptoInfo.iv),
            });
            if (shouldDecryptInProxy) return "";
            return rewriteM3u8UriAttributes(line, baseUrl, port, decryptMode);
          }
          if (attrs.METHOD === "NONE") {
            currentCryptoInfo = undefined;
            return shouldDecryptInProxy ? "" : line;
          }
        }
        return rewriteM3u8UriAttributes(line, baseUrl, port, decryptMode);
      }

      const absoluteUrl = new URL(line, baseUrl).toString();
      if (shouldDecryptInProxy && currentCryptoInfo) {
        const iv =
          currentCryptoInfo.iv || createMediaSequenceIv(nextSegmentSequence);
        segmentCryptoInfoByUrl.set(absoluteUrl, {
          keyUrl: currentCryptoInfo.keyUrl,
          iv,
        });
        debugLog("segment registered for proxy decrypt", {
          segmentUrl: absoluteUrl,
          keyUrl: currentCryptoInfo.keyUrl,
          sequence: nextSegmentSequence,
          iv: iv.toString("hex"),
          explicitIv: Boolean(currentCryptoInfo.iv),
        });
      }
      nextSegmentSequence += 1;
      return createProxyUrl(port, absoluteUrl, decryptMode);
    })
    .join("\n");
};

const getHlsKey = async (
  keyUrl: string,
  headers: http.IncomingHttpHeaders,
) => {
  const cachedKey = keyCacheByUrl.get(keyUrl);
  if (cachedKey) {
    debugLog("key cache hit", {
      keyUrl,
      bytes: cachedKey.length,
      firstBytesHex: cachedKey.subarray(0, 8).toString("hex"),
    });
    return cachedKey;
  }

  const response = await fetchTarget(keyUrl, headers);
  debugLog("key fetched", {
    keyUrl,
    statusCode: response.statusCode,
    ...getBodyPreview(response.body),
  });
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(`HLS key request failed: HTTP ${response.statusCode}`);
  }
  if (response.body.length !== 16) {
    throw new Error(`Invalid HLS AES-128 key length: ${response.body.length}`);
  }

  keyCacheByUrl.set(keyUrl, response.body);
  return response.body;
};

const getM3u8DebugInfo = (content: string) => {
  const lines = content.split(/\r?\n/);
  const keyLines = lines.filter((line) => line.startsWith("#EXT-X-KEY"));
  const segmentLines = lines.filter((line) => line && !line.startsWith("#"));
  return {
    lineCount: lines.length,
    keyLines,
    segmentCount: segmentLines.length,
    firstLines: lines.slice(0, 12),
  };
};

const writeCorsHeaders = (res: http.ServerResponse) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Range, Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Private-Network", "true");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
};

const getProxyPort = async () => {
  if (!serverPromise) {
    serverPromise = new Promise((resolve, reject) => {
      const server = http.createServer(async (req, res) => {
        writeCorsHeaders(res);

        if (req.method === "OPTIONS") {
          res.writeHead(204);
          res.end();
          return;
        }

        try {
          const requestUrl = new URL(req.url || "/", "http://127.0.0.1");
          if (requestUrl.pathname === "/hls-player") {
            const targetUrl = requestUrl.searchParams.get("url") || "";
            const parsedTargetUrl = new URL(targetUrl);
            if (!isAllowedTarget(parsedTargetUrl)) {
              debugLog("player rejected target", targetUrl);
              res.writeHead(403);
              res.end("Unsupported target");
              return;
            }

            const address = server.address();
            const currentPort =
              address && typeof address === "object" ? address.port : 0;
            const sourceUrl = createProxyUrl(currentPort, targetUrl);
            const browserDecryptSourceUrl = createProxyUrl(
              currentPort,
              targetUrl,
              "browser",
            );
            debugLog("serve external player", {
              targetUrl,
              sourceUrl,
              browserDecryptSourceUrl,
            });
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            res.setHeader("Cache-Control", "no-store");
            res.writeHead(200);
            res.end(
              createPlayerHtml(targetUrl, sourceUrl, browserDecryptSourceUrl),
            );
            return;
          }

          if (requestUrl.pathname !== "/hls-proxy") {
            debugLog("unknown proxy path", requestUrl.pathname);
            res.writeHead(404);
            res.end("Not found");
            return;
          }

          const targetUrl = requestUrl.searchParams.get("url") || "";
          const decryptMode: ProxyDecryptMode =
            requestUrl.searchParams.get("decrypt") === "browser"
              ? "browser"
              : "server";
          debugLog("proxy request", {
            method: req.method,
            targetUrl,
            decryptMode,
            range: req.headers.range || "",
            origin: req.headers.origin || "",
          });
          const parsedTargetUrl = new URL(targetUrl);
          if (!isAllowedTarget(parsedTargetUrl)) {
            debugLog("proxy rejected target", targetUrl);
            res.writeHead(403);
            res.end("Unsupported target");
            return;
          }

          const response = await fetchTarget(targetUrl, req.headers);
          if (shouldRewriteAsM3u8(targetUrl, response.headers, response.body)) {
            const address = server.address();
            const currentPort =
              address && typeof address === "object" ? address.port : 0;
            const rewritten = rewriteM3u8(
              response.body.toString("utf8"),
              response.finalUrl,
              currentPort,
              decryptMode,
            );
            debugLog("rewrite m3u8", {
              targetUrl,
              decryptMode,
              statusCode: response.statusCode,
              originalBytes: response.body.length,
              rewrittenBytes: Buffer.byteLength(rewritten),
              segmentCount: rewritten.split("/hls-proxy?url=").length - 1,
              originalPlaylist: getM3u8DebugInfo(
                response.body.toString("utf8"),
              ),
              rewrittenPlaylist: getM3u8DebugInfo(rewritten),
            });
            res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
            res.setHeader("Cache-Control", "no-store");
            res.writeHead(response.statusCode);
            res.end(rewritten);
            return;
          }

          const kind = getTargetKind(targetUrl);
          let responseBody = response.body;
          const cryptoInfo = segmentCryptoInfoByUrl.get(targetUrl);
          if (
            decryptMode === "server" &&
            kind === "segment" &&
            cryptoInfo &&
            response.statusCode >= 200 &&
            response.statusCode < 300
          ) {
            const key = await getHlsKey(cryptoInfo.keyUrl, req.headers);
            responseBody = decryptAes128Cbc(response.body, key, cryptoInfo.iv);
            debugLog("segment decrypted", {
              targetUrl,
              encrypted: getBodyPreview(response.body),
              decrypted: getBodyPreview(responseBody),
              keyUrl: cryptoInfo.keyUrl,
              iv: cryptoInfo.iv.toString("hex"),
            });
          }

          const passthroughHeaders = [
            "content-type",
            "content-range",
            "cache-control",
          ];
          passthroughHeaders.forEach((header) => {
            const value = response.headers[header];
            if (value) res.setHeader(header, value);
          });
          if (kind === "key") {
            res.setHeader("Content-Type", "application/octet-stream");
          }
          if (kind === "segment") {
            res.setHeader("Content-Type", "video/mp2t");
          }
          res.setHeader("Content-Length", Buffer.byteLength(responseBody));
          debugLog("proxy passthrough", {
            targetUrl,
            kind,
            decryptMode,
            statusCode: response.statusCode,
            contentType: response.headers["content-type"],
            ...getBodyPreview(responseBody),
            encrypted: Boolean(cryptoInfo),
          });
          res.writeHead(response.statusCode);
          res.end(responseBody);
        } catch (error) {
          debugLog("proxy error", {
            message: error instanceof Error ? error.message : String(error),
          });
          res.writeHead(502);
          res.end(error instanceof Error ? error.message : "HLS proxy error");
        }
      });

      server.on("error", reject);
      server.listen(0, "127.0.0.1", () => {
        const address = server.address();
        if (!address || typeof address === "string") {
          reject(new Error("Failed to start HLS proxy"));
          return;
        }
        debugLog("proxy server started", {
          port: address.port,
          url: `http://127.0.0.1:${address.port}/hls-proxy`,
        });
        resolve({ port: address.port });
      });
    });
  }

  return (await serverPromise).port;
};

export const getFenbiHlsProxyUrl = async (targetUrl: string) => {
  const port = await getProxyPort();
  const proxyUrl = createProxyUrl(port, targetUrl);
  debugLog("create playback url", { targetUrl, proxyUrl });
  return proxyUrl;
};

export const getFenbiHlsPlayerUrl = async (targetUrl: string) => {
  const port = await getProxyPort();
  const playerUrl = createPlayerUrl(port, targetUrl);
  debugLog("create player url", { targetUrl, playerUrl });
  return playerUrl;
};
