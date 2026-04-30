/* eslint-disable no-console */
import * as React from "react";
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  Modal,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import {
  MaterialData,
  SydwmsEpisodeItem,
  SydwmsEpisodeMediaItem,
  SydwmsInterviewDetailPayload,
  SydwmsSolutionAccessory,
  SydwmsSolutionItem,
} from "../types";
import { useVscodeMessage } from "../hooks/useVscodeMessage";
import { getVscodeApi } from "../utils/vscodeApi";
import { setImg } from "../utils/setImg";
import "../style/detail.less";

const vscode = getVscodeApi();
const { Text, Title } = Typography;
const HLS_SCRIPT_URL =
  "https://web.sdk.qcloud.com/player/tcplayer/release/v4.9.1/libs/hls.min.1.1.7.js";

let hlsScriptPromise: Promise<void> | undefined;

interface SydwmsDetailLocationState {
  keypointId?: number | string;
  title?: string;
  questionIndex?: number;
}

type EpisodeKind = "reading" | "analysis" | "sampleAnswer" | "other";

interface HlsInstance {
  loadSource: (src: string) => void;
  attachMedia: (video: HTMLVideoElement) => void;
  destroy: () => void;
  recoverMediaError?: () => void;
  on?: (
    event: string,
    handler: (event: string, data: HlsErrorData) => void,
  ) => void;
}

interface HlsConstructor {
  new (config?: Record<string, unknown>): HlsInstance;
  isSupported?: () => boolean;
}

interface HlsErrorData {
  type?: string;
  details?: string;
  fatal?: boolean;
  response?: {
    code?: number;
    text?: string;
    url?: string;
  };
  url?: string;
}

type HlsWindow = Window & {
  Hls?: HlsConstructor;
};

const HLS_CONFIG = {
  enableWorker: false,
  manifestLoadingMaxRetry: 0,
  levelLoadingMaxRetry: 0,
  fragLoadingMaxRetry: 0,
  keyLoadingMaxRetry: 0,
  appendErrorMaxRetry: 0,
};

const sectionStyle: React.CSSProperties = {
  borderTop: "1px solid rgba(255, 255, 255, 0.22)",
  padding: "14px 0",
};

const mediaBoxStyle: React.CSSProperties = {
  marginBottom: 12,
  padding: 10,
  border: "1px solid rgba(255, 255, 255, 0.18)",
  borderRadius: 6,
};

const htmlContentStyle: React.CSSProperties = {
  lineHeight: 1.8,
  wordBreak: "break-word",
};

const getQuestionId = (item: SydwmsSolutionItem) => {
  return item.id || item.globalId || item.questionId || item.idStr;
};

const pickText = (item: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string" && value.trim()) return value;
    if (value && typeof value === "object") {
      const nested = pickText(value as Record<string, unknown>, keys);
      if (nested) return nested;
    }
  }
  return "";
};

const normalizeUrl = (url?: string) => {
  if (!url) return "";
  return url.startsWith("//") ? `https:${url}` : url;
};

const removeAudio = (html: string) => {
  return html
    .replace(/<audio[\s\S]*?<\/audio>/gi, "")
    .replace(/<audio[^>]*\/>/gi, "")
    .replace(/<source[^>]*type=["']audio\/[^>]*>/gi, "");
};

const getQuestionContent = (item: SydwmsSolutionItem) => {
  return pickText(item, ["content"]);
};

const getAnswerContent = (item: SydwmsSolutionItem) => {
  return pickText(item, ["correctAnswer", "answer"]);
};

const getSolutionContent = (item: SydwmsSolutionItem) => {
  return removeAudio(pickText(item, ["solution"]));
};

const getSourceContent = (item: SydwmsSolutionItem) => {
  return pickText(item, ["source", "shortSource"]);
};

const getMaterialContent = (material: MaterialData | null) => {
  if (!material) return "";
  return pickText(material as Record<string, unknown>, ["content", "text"]);
};

const getMaterialContents = (materials: Array<MaterialData | null>) => {
  return materials.map(getMaterialContent).filter(Boolean);
};

const getAccessoryContent = (accessory: SydwmsSolutionAccessory) => {
  return removeAudio(pickText(accessory, ["content", "title", "name"]));
};

const getAccessoriesByLabel = (item: SydwmsSolutionItem, label: string) => {
  return (item.solutionAccessories || [])
    .filter((accessory) => accessory.label === label)
    .map(getAccessoryContent)
    .filter(Boolean);
};

const getOtherAccessorySections = (item: SydwmsSolutionItem) => {
  const knownLabels = new Set([
    "stzd",
    "swdt",
    "sfdt",
    "year",
    "exam_category",
    "applicable_region",
    "usage_scenario",
    "interview_format",
    "topic",
    "background",
  ]);

  return (item.solutionAccessories || [])
    .filter((accessory) => !knownLabels.has(String(accessory.label || "")))
    .map((accessory, index) => ({
      key: `${accessory.label || "other"}-${index}`,
      title: accessory.title || accessory.name || "补充解析",
      content: getAccessoryContent(accessory),
    }))
    .filter((section) => section.content);
};

const findMediaInfo = (value: unknown): SydwmsEpisodeMediaItem | undefined => {
  if (!value) return undefined;

  if (Array.isArray(value)) {
    for (const item of value) {
      const media = findMediaInfo(item);
      if (media) return media;
    }
    return undefined;
  }

  if (typeof value !== "object") return undefined;

  const record = value as Record<string, unknown>;
  const playbackUrl =
    typeof record.playbackUrl === "string" && record.playbackUrl
      ? record.playbackUrl
      : record.url;
  if (typeof playbackUrl === "string" && playbackUrl) {
    return {
      ...(record as SydwmsEpisodeMediaItem),
      url: normalizeUrl(playbackUrl),
    };
  }

  for (const key of Object.keys(record)) {
    const media = findMediaInfo(record[key]);
    if (media) return media;
  }

  return undefined;
};

const getEpisodeMediaInfo = (item: SydwmsEpisodeItem) => {
  return findMediaInfo(item.media) || findMediaInfo(item.meta);
};

const getEpisodeTitle = (item: SydwmsEpisodeItem, index: number) => {
  return item.title || item.name || `媒体 ${index + 1}`;
};

const getEpisodeKind = (item: SydwmsEpisodeItem): EpisodeKind => {
  const title = String(item.title || item.name || "");
  const media = getEpisodeMediaInfo(item);

  if (title.includes("读题") || /\.mp3/i.test(media?.url || "")) {
    return "reading";
  }
  if (title.includes("示范作答")) {
    return "sampleAnswer";
  }
  if (title.includes("解析") || item.hasVideo || media?.url) {
    return "analysis";
  }
  return "other";
};

const findEpisodes = (
  episodes: SydwmsEpisodeItem[],
  question: SydwmsSolutionItem,
) => {
  const questionId = String(getQuestionId(question) || "");
  return episodes.filter((item) => {
    const itemQuestionId = item.questionId || item.tikuId;
    return !itemQuestionId || String(itemQuestionId) === questionId;
  });
};

const getMediaDurationText = (duration?: number) => {
  if (!duration) return "";

  const minutes = Math.floor(duration / 60);
  const seconds = Math.round(duration % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const isHlsUrl = (src: string) => {
  return /m3u8/i.test(src);
};

const loadHlsScript = () => {
  const Hls = (window as HlsWindow).Hls;
  if (Hls) {
    console.log("[FenbiTools:Player] Hls already loaded");
    return Promise.resolve();
  }

  if (!hlsScriptPromise) {
    console.log("[FenbiTools:Player] loading HLS script", HLS_SCRIPT_URL);
    hlsScriptPromise = new Promise((resolve, reject) => {
      const existingScript = Array.from(document.scripts).find((script) => {
        return script.src === HLS_SCRIPT_URL;
      });

      if (existingScript) {
        console.log("[FenbiTools:Player] reuse existing HLS script element");
        existingScript.addEventListener(
          "load",
          () => {
            console.log("[FenbiTools:Player] existing HLS script loaded");
            resolve();
          },
          { once: true },
        );
        existingScript.addEventListener(
          "error",
          (error) => {
            console.error(
              "[FenbiTools:Player] existing HLS script error",
              error,
            );
            reject(error);
          },
          { once: true },
        );
        return;
      }

      const script = document.createElement("script");
      script.src = HLS_SCRIPT_URL;
      script.async = true;
      script.onload = () => {
        console.log("[FenbiTools:Player] HLS script loaded");
        resolve();
      };
      script.onerror = (error) => {
        console.error("[FenbiTools:Player] HLS script error", error);
        reject(error);
      };
      document.head.appendChild(script);
    });
  }

  return hlsScriptPromise;
};

const getHlsErrorMessage = (data?: HlsErrorData) => {
  if (!data) return "HLS 播放失败";

  const parts = [
    data.type,
    data.details,
    data.fatal ? "fatal" : "",
    data.response?.code ? `HTTP ${data.response.code}` : "",
    data.response?.text,
    data.response?.url || data.url,
  ].filter(Boolean);

  return parts.length ? parts.join(" | ") : "HLS 播放失败";
};

const VideoPlayer = ({
  src,
  playerUrl,
}: {
  src: string;
  playerUrl?: string;
}) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let disposed = false;
    let stopped = false;
    let hls: HlsInstance | undefined;
    const isHls = isHlsUrl(src);

    const clearVideoSource = () => {
      video.removeAttribute("src");
      video.load();
    };

    const stopPlayback = (message: string, detail?: unknown) => {
      if (disposed || stopped) return;
      stopped = true;
      console.warn("[FenbiTools:Player] stop playback after failure", {
        src,
        playerUrl,
        message,
        detail,
      });
      hls?.destroy();
      hls = undefined;
      clearVideoSource();
      setError(message);
    };

    setError("");
    console.log("[FenbiTools:Player] init video", {
      src,
      isHls,
      nativeHls: video.canPlayType("application/vnd.apple.mpegurl"),
    });
    const onVideoError = () => {
      if (disposed || stopped) return;

      const code = video.error?.code;
      console.error("[FenbiTools:Player] video element error", {
        src,
        playerUrl,
        code,
        message: video.error?.message,
      });
      stopPlayback(
        code === 4
          ? "VS Code 内置播放器不支持该视频音频编码，请打开媒体地址查看"
          : code
            ? `视频加载失败，错误码：${code}`
            : "视频加载失败",
        {
          code,
          message: video.error?.message,
        },
      );
    };
    video.addEventListener("error", onVideoError);

    if (!isHls) {
      console.log("[FenbiTools:Player] use native video src", { src });
      video.src = src;
      return () => {
        console.log("[FenbiTools:Player] cleanup native video", { src });
        video.removeEventListener("error", onVideoError);
        video.removeAttribute("src");
        video.load();
      };
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      console.log("[FenbiTools:Player] use native HLS", { src });
      video.src = src;
      return () => {
        console.log("[FenbiTools:Player] cleanup native HLS", { src });
        video.removeEventListener("error", onVideoError);
        video.removeAttribute("src");
        video.load();
      };
    }

    fetch(src)
      .then((response) => {
        console.log("[FenbiTools:Player] HLS probe response", {
          src,
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get("content-type"),
        });
        if (!response.ok) {
          throw new Error(`HLS 代理请求失败：HTTP ${response.status}`);
        }
        return loadHlsScript();
      })
      .then(() => {
        if (disposed) return;

        const Hls = (window as HlsWindow).Hls;
        console.log("[FenbiTools:Player] HLS constructor ready", {
          hasHls: Boolean(Hls),
          supported: Hls?.isSupported?.(),
          src,
        });
        if (Hls?.isSupported?.()) {
          hls = new Hls(HLS_CONFIG);
          hls.on?.("hlsError", (_event, data) => {
            if (disposed || stopped) return;
            console.error("[FenbiTools:Player] hls.js error", {
              src,
              data,
            });
            if (data.details === "bufferStalledError") return;
            if (
              data.fatal ||
              data.details === "bufferAppendError" ||
              data.details === "fragParsingError"
            ) {
              stopPlayback(
                data.details === "bufferAppendError"
                  ? "VS Code 内置播放器无法解码该视频流，请打开媒体地址查看"
                  : getHlsErrorMessage(data),
                data,
              );
              return;
            }
            setError(getHlsErrorMessage(data));
          });
          console.log("[FenbiTools:Player] hls.js loadSource", { src });
          hls.loadSource(src);
          hls.attachMedia(video);
          console.log("[FenbiTools:Player] hls.js attachMedia done", { src });
          return;
        }

        console.warn(
          "[FenbiTools:Player] hls.js unsupported, fallback to video src",
          {
            src,
          },
        );
        video.src = src;
      })
      .catch((error: Error) => {
        console.error("[FenbiTools:Player] HLS setup failed", {
          src,
          message: error.message,
        });
        if (!disposed) {
          setError(error.message || "当前环境未能加载 HLS 播放器或代理地址");
        }
      });

    return () => {
      disposed = true;
      console.log("[FenbiTools:Player] cleanup HLS video", { src });
      hls?.destroy();
      video.removeEventListener("error", onVideoError);
      clearVideoSource();
    };
  }, [src, playerUrl]);

  return (
    <>
      <video
        ref={videoRef}
        controls
        style={{ maxWidth: "100%", width: "100%" }}
      />
      {error && (
        <Alert
          type="warning"
          showIcon
          message={error}
          description={
            <Space direction="vertical" size={8}>
              <MediaAddressButton src={src} />
            </Space>
          }
          style={{ marginTop: 8 }}
        />
      )}
    </>
  );
};

const HtmlBlock = ({
  html,
  emptyText,
}: {
  html?: string;
  emptyText: string;
}) => {
  if (!html) return <Text type="secondary">{emptyText}</Text>;

  return (
    <div
      className="solution"
      style={htmlContentStyle}
      dangerouslySetInnerHTML={{ __html: setImg(html) }}
    />
  );
};

const DetailSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <section style={sectionStyle}>
      <Title level={5} style={{ marginTop: 0 }}>
        {title}
      </Title>
      {children}
    </section>
  );
};

const MediaAddressButton = ({ src }: { src?: string }) => {
  return (
    <Button
      size="small"
      type="primary"
      disabled={!src}
      href={src}
      target="_blank"
      rel="noreferrer"
    >
      打开媒体地址
    </Button>
  );
};

const EpisodeList = ({ episodes }: { episodes: SydwmsEpisodeItem[] }) => {
  if (!episodes.length) return null;

  return (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      {episodes.map((episode, index) => {
        const media = getEpisodeMediaInfo(episode);
        const durationText = getMediaDurationText(media?.duration);
        const key = String(
          episode.episodeId || episode.episode_id || episode.id || index,
        );
        console.log("[FenbiTools:Player] render episode media", {
          title: getEpisodeTitle(episode, index),
          media,
        });

        return (
          <div key={key} style={mediaBoxStyle}>
            <Space wrap size={8} style={{ marginBottom: 8 }}>
              <Text strong>{getEpisodeTitle(episode, index)}</Text>
              {durationText && <Tag>{durationText}</Tag>}
              {media?.width && media?.height && (
                <Tag>
                  {media.width}x{media.height}
                </Tag>
              )}
            </Space>

            {media?.url ? (
              <VideoPlayer src={media.url} playerUrl={media.playerUrl} />
            ) : (
              <Text type="secondary">暂无媒体地址</Text>
            )}
          </div>
        );
      })}
    </Space>
  );
};

const SampleAnswerList = ({ episodes }: { episodes: SydwmsEpisodeItem[] }) => {
  if (!episodes.length) return null;

  return (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      {episodes.map((episode, index) => {
        const media = getEpisodeMediaInfo(episode);
        const key = String(
          episode.episodeId || episode.episode_id || episode.id || index,
        );
        const title = getEpisodeTitle(episode, index);

        console.log("[FenbiTools:Player] render sample answer media address", {
          title,
          media,
        });

        return (
          <div key={key} style={mediaBoxStyle}>
            <MediaAddressButton src={media?.url} />
          </div>
        );
      })}
    </Space>
  );
};

const NotesBlock = ({
  notes,
  questionId,
}: {
  notes: unknown;
  questionId?: number | string;
}) => {
  const noteTexts = React.useMemo(() => {
    const result: string[] = [];

    const visit = (value: unknown) => {
      if (!value) return;
      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }
      if (typeof value !== "object") return;

      const record = value as Record<string, unknown>;
      const relatedId = record.questionId || record.tikuId || record.id;
      const isRelated =
        !questionId || !relatedId || String(relatedId) === String(questionId);

      if (isRelated) {
        ["content", "note", "text"].forEach((key) => {
          const content = record[key];
          if (typeof content === "string" && content.trim()) {
            result.push(content);
          }
        });
      }

      Object.keys(record).forEach((key) => visit(record[key]));
    };

    visit(notes);
    return Array.from(new Set(result));
  }, [notes, questionId]);

  if (!noteTexts.length) {
    return <Text type="secondary">暂无笔记</Text>;
  }

  return (
    <Space direction="vertical" size={8} style={{ width: "100%" }}>
      {noteTexts.map((content, index) => (
        <HtmlBlock key={index} html={content} emptyText="暂无笔记" />
      ))}
    </Space>
  );
};

export const SydwmsDetail = () => {
  const [modal, contextHolder] = Modal.useModal();
  const [loading, setLoading] = React.useState(true);
  const [detail, setDetail] = React.useState<SydwmsInterviewDetailPayload>();
  const [questionNumberInput, setQuestionNumberInput] = React.useState("1");
  const navigate = useNavigate();
  const location = useLocation();
  const { keypointId, title, questionIndex } = (location.state ||
    {}) as SydwmsDetailLocationState;
  const routeQuestionIndex = Math.max(Number(questionIndex) || 0, 0);
  const currentQuestionIndex = detail?.questionIndex ?? routeQuestionIndex;
  const questionCount = detail?.questionCount || 0;
  const currentTitle = title || String(keypointId || "");

  React.useEffect(() => {
    if (!keypointId) {
      setLoading(false);
      modal.error({ title: "提示", content: "缺少面试题目 ID" });
      return;
    }

    setDetail(undefined);
    setLoading(true);
    window.scrollTo(0, 0);
    vscode.postMessage({
      command: "getSydwmsInterviewDetail",
      postData: { keypointId, questionIndex: routeQuestionIndex },
    });
  }, [keypointId, routeQuestionIndex]);

  React.useEffect(() => {
    setQuestionNumberInput(String(currentQuestionIndex + 1));
  }, [currentQuestionIndex]);

  const onBack = () => {
    navigate(-1);
  };

  const goQuestionIndex = (nextQuestionIndex: number) => {
    if (loading) return;

    navigate("/sydwms-detail", {
      replace: true,
      state: {
        keypointId,
        title,
        questionIndex: nextQuestionIndex,
      },
    });
  };

  const onPreviousQuestion = () => {
    if (loading) return;
    if (currentQuestionIndex <= 0) {
      modal.info({ title: "提示", content: "已经是第一题" });
      return;
    }
    goQuestionIndex(currentQuestionIndex - 1);
  };

  const onNextQuestion = () => {
    if (loading) return;
    if (questionCount && currentQuestionIndex >= questionCount - 1) {
      modal.info({ title: "提示", content: "已经是最后一题" });
      return;
    }
    goQuestionIndex(currentQuestionIndex + 1);
  };

  const commitQuestionNumber = () => {
    if (loading || !questionCount) return;

    const nextQuestionNumber = Number(questionNumberInput);
    if (
      !Number.isInteger(nextQuestionNumber) ||
      nextQuestionNumber < 1 ||
      nextQuestionNumber > questionCount
    ) {
      setQuestionNumberInput(String(currentQuestionIndex + 1));
      modal.info({
        title: "提示",
        content: `题号范围是 1-${questionCount}`,
      });
      return;
    }

    const nextQuestionIndex = nextQuestionNumber - 1;
    if (nextQuestionIndex === currentQuestionIndex) return;
    goQuestionIndex(nextQuestionIndex);
  };

  useVscodeMessage((message) => {
    if (message.command === "sydwmsInterviewDetail") {
      const payload = message.data as SydwmsInterviewDetailPayload;
      if (payload.questionIndex !== routeQuestionIndex) return;
      setLoading(false);
      setDetail(payload);
    }
    if (message.command === "message") {
      setLoading(false);
      modal.error({
        title: "提示",
        content: (message.data as { message?: string })?.message || "",
      });
    }
  });

  const questions = detail?.questions || [];
  const episodes = detail?.episodes || [];
  const materialContents = getMaterialContents(detail?.materials || []);

  return (
    <div className="detail_page">
      <Spin tip="loading..." spinning={loading}>
        <div className="question-container">
          <div className="top-bar">
            <Button type="text" onClick={onBack}>
              返回上一页
            </Button>
            <Button
              disabled={loading || !questionCount}
              onClick={onPreviousQuestion}
            >
              上一题
            </Button>
            <Space size={4}>
              <Input
                size="small"
                value={questionNumberInput}
                disabled={loading || !questionCount}
                style={{ width: 56, textAlign: "center" }}
                onChange={(event) => {
                  setQuestionNumberInput(event.target.value.replace(/\D/g, ""));
                }}
                onBlur={commitQuestionNumber}
                onPressEnter={commitQuestionNumber}
              />
              <Text>/ {questionCount || "-"}</Text>
            </Space>
            <Button
              type="primary"
              style={{ borderColor: "white" }}
              disabled={loading || !questionCount}
              onClick={onNextQuestion}
            >
              下一题
            </Button>
          </div>

          {currentTitle && <Title level={4}>{currentTitle}</Title>}

          <DetailSection title="材料">
            {materialContents.length ? (
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                {materialContents.map((content, index) => (
                  <HtmlBlock key={index} html={content} emptyText="没有材料" />
                ))}
              </Space>
            ) : (
              <Text type="secondary">没有材料</Text>
            )}
          </DetailSection>

          {!questions.length && !loading && (
            <Empty description="暂无面试题内容" />
          )}

          {questions.map((question, index) => {
            const questionId = getQuestionId(question);
            const questionEpisodes = findEpisodes(episodes, question);
            const analysisEpisodes = questionEpisodes.filter(
              (episode) => getEpisodeKind(episode) === "analysis",
            );
            const sampleAnswerEpisodes = questionEpisodes.filter(
              (episode) => getEpisodeKind(episode) === "sampleAnswer",
            );
            const otherEpisodes = questionEpisodes.filter(
              (episode) => getEpisodeKind(episode) === "other",
            );
            const questionContent = getQuestionContent(question);
            const answerContent = getAnswerContent(question);
            const solutionContent = getSolutionContent(question);
            const sourceContent = getSourceContent(question);
            const reviewContents = getAccessoriesByLabel(question, "stzd");
            const mindContents = getAccessoriesByLabel(question, "swdt");
            const exampleContents = getAccessoriesByLabel(question, "sfdt");
            const otherAccessorySections = getOtherAccessorySections(question);

            return (
              <Card
                key={String(questionId || index)}
                style={{ marginBottom: 12 }}
              >
                <DetailSection title="问题">
                  <HtmlBlock html={questionContent} emptyText="暂无问题" />
                </DetailSection>

                {reviewContents.length > 0 && (
                  <DetailSection title="粉笔审题">
                    <Space
                      direction="vertical"
                      size={12}
                      style={{ width: "100%" }}
                    >
                      {reviewContents.map((content, contentIndex) => (
                        <HtmlBlock
                          key={contentIndex}
                          html={content}
                          emptyText="暂无粉笔审题"
                        />
                      ))}
                    </Space>
                  </DetailSection>
                )}

                <DetailSection title="答案">
                  <HtmlBlock html={answerContent} emptyText="暂无答案" />
                </DetailSection>

                <DetailSection title="解析">
                  <HtmlBlock html={solutionContent} emptyText="暂无解析" />
                </DetailSection>

                {analysisEpisodes.length > 0 && (
                  <DetailSection title="解析视频">
                    <EpisodeList episodes={analysisEpisodes} />
                  </DetailSection>
                )}

                {sampleAnswerEpisodes.length > 0 && (
                  <DetailSection title="示范作答">
                    <SampleAnswerList episodes={sampleAnswerEpisodes} />
                  </DetailSection>
                )}

                {mindContents.length > 0 && (
                  <DetailSection title="粉笔思维">
                    <Space
                      direction="vertical"
                      size={12}
                      style={{ width: "100%" }}
                    >
                      {mindContents.map((content, contentIndex) => (
                        <HtmlBlock
                          key={contentIndex}
                          html={content}
                          emptyText="暂无粉笔思维"
                        />
                      ))}
                    </Space>
                  </DetailSection>
                )}

                {exampleContents.length > 0 && (
                  <DetailSection title="粉笔示例">
                    <Space
                      direction="vertical"
                      size={12}
                      style={{ width: "100%" }}
                    >
                      {exampleContents.map((content, contentIndex) => (
                        <HtmlBlock
                          key={contentIndex}
                          html={content}
                          emptyText="暂无粉笔示例"
                        />
                      ))}
                    </Space>
                  </DetailSection>
                )}

                {otherAccessorySections.map((section) => (
                  <DetailSection key={section.key} title={section.title}>
                    <HtmlBlock html={section.content} emptyText="暂无内容" />
                  </DetailSection>
                ))}

                {otherEpisodes.length > 0 && (
                  <DetailSection title="其他媒体">
                    <EpisodeList episodes={otherEpisodes} />
                  </DetailSection>
                )}

                <DetailSection title="来源">
                  <HtmlBlock html={sourceContent} emptyText="暂无来源" />
                </DetailSection>

                <DetailSection title="笔记">
                  <NotesBlock notes={detail?.notes} questionId={questionId} />
                </DetailSection>
              </Card>
            );
          })}
        </div>
      </Spin>
      {contextHolder}
    </div>
  );
};
