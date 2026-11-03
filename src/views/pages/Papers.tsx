import * as React from "react";
import { ArrowLeftOutlined, FileTextOutlined } from "@ant-design/icons";
import { Button, Empty, Pagination, Radio, Spin, message } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { useSetting } from "../components/hooks";
import { useVscodeMessage } from "../hooks/useVscodeMessage";
import { getVscodeApi } from "../utils/vscodeApi";
import { PaperCatalogPayload, PaperLabel, PastPaper } from "../types";
import "../style/papers.less";

const vscode = getVscodeApi();
const PAGE_SIZE = 12;

interface PapersLocationState {
  category?: string;
}

const getPaperId = (paper: PastPaper) => paper.paperId ?? paper.id;

const getPaperName = (paper: PastPaper) => {
  return paper.name || paper.title || String(paper.paperName || "历年试卷");
};

const getPaperMeta = (paper: PastPaper) => {
  const parts = [paper.year && `${paper.year}年`, paper.province || paper.area];
  const count = paper.questionCount ?? paper.count;
  if (count) parts.push(`${count}题`);
  return parts.filter(Boolean).join(" · ");
};

const normalizeLabels = (labels: PaperLabel[]) => {
  const seen = new Set<string>();
  return [{ id: "", name: "全部" }, ...labels].filter((label) => {
    const id = String(label.id ?? "");
    if (!label.name || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

export const Papers = () => {
  const [messageApi, messageHolder] = message.useMessage();
  const { setting } = useSetting();
  const location = useLocation();
  const navigate = useNavigate();
  const category =
    ((location.state || {}) as PapersLocationState).category ||
    setting.categoryId ||
    "xingce";
  const [catalog, setCatalog] = React.useState<PaperCatalogPayload>({
    labels: [],
    papers: [],
    page: 1,
    pageSize: PAGE_SIZE,
  });
  const [selectedLabel, setSelectedLabel] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const requestCatalog = React.useCallback(
    (page = 1, labelId = selectedLabel) => {
      setLoading(true);
      vscode.postMessage({
        command: "getPaperCatalog",
        postData: {
          category,
          page,
          pageSize: PAGE_SIZE,
          labelId,
        },
      });
    },
    [category, selectedLabel],
  );

  React.useEffect(() => {
    requestCatalog(1, "");
  }, [requestCatalog]);

  useVscodeMessage(
    React.useCallback(
      (incoming) => {
        if (incoming.command === "paperCatalog") {
          setCatalog((previous) =>
            (incoming.data as PaperCatalogPayload) || previous,
          );
          setLoading(false);
        }
        if (incoming.command === "message") {
          messageApi.info(
            (incoming.data as { message?: string })?.message || "操作失败",
          );
          setLoading(false);
        }
      },
      [messageApi],
    ),
  );

  const labels = normalizeLabels(catalog.labels || []);
  const hasTotal = typeof catalog.total === "number";
  const total = hasTotal
    ? catalog.total || 0
    : catalog.hasMore
      ? catalog.page * PAGE_SIZE + 1
      : catalog.papers.length;

  const startPaper = (paper: PastPaper) => {
    const paperId = getPaperId(paper);
    if (!paperId) {
      messageApi.info("缺少试卷 ID，无法开始答题");
      return;
    }
    navigate("/detail", {
      state: {
        category,
        mode: "real",
        paperId,
        paperTitle: getPaperName(paper),
      },
    });
  };

  return (
    <div className="papers-page">
      {messageHolder}
      <div className="papers-header">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
        >
          返回首页
        </Button>
        <div>
          <h2>历年试卷</h2>
          <p>按年份和地区选择整套试卷，进入后按真实考试顺序作答。</p>
        </div>
      </div>

      <div className="papers-filter">
        <span className="papers-filter-label">试卷分类</span>
        <Radio.Group
          value={selectedLabel}
          optionType="button"
          buttonStyle="solid"
          options={labels.map((label) => ({
            label: label.name,
            value: String(label.id ?? ""),
          }))}
          onChange={(event) => {
            const nextLabel = event.target.value;
            setSelectedLabel(nextLabel);
            requestCatalog(1, nextLabel);
          }}
        />
      </div>

      <Spin spinning={loading} tip="加载试卷中...">
        {catalog.papers.length > 0 ? (
          <div className="paper-grid">
            {catalog.papers.map((paper, index) => (
              <article className="paper-card" key={String(getPaperId(paper) || index)}>
                <div className="paper-card-icon">
                  <FileTextOutlined />
                </div>
                <div className="paper-card-body">
                  <h3>{getPaperName(paper)}</h3>
                  <p>{getPaperMeta(paper) || "整套试卷"}</p>
                </div>
                <Button type="primary" onClick={() => startPaper(paper)}>
                  开始答题
                </Button>
              </article>
            ))}
          </div>
        ) : (
          <Empty description="暂无符合条件的试卷" />
        )}
      </Spin>

      {total > PAGE_SIZE && (
        <div className="papers-pagination">
          <Pagination
            current={catalog.page || 1}
            pageSize={PAGE_SIZE}
            total={total}
            showSizeChanger={false}
            onChange={(page) => requestCatalog(page)}
          />
        </div>
      )}
    </div>
  );
};
