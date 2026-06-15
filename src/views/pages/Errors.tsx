import * as React from "react";
import { Button, Empty, Flex, Spin, message } from "antd";
import { DataNode } from "antd/es/tree";
import { useLocation, useNavigate } from "react-router-dom";
import { CustomTree } from "../components/custom-tree";
import { useSetting } from "../components/hooks";
import { useVscodeMessage } from "../hooks/useVscodeMessage";
import { getVscodeApi } from "../utils/vscodeApi";
import { SELECTENUM } from "../utils/constant";
import { ErrorKeypointNode } from "../types";
import "../style/detail.less";

const vscode = getVscodeApi();

interface ErrorTreeNode extends DataNode {
  children?: ErrorTreeNode[];
}

interface ErrorsLocationState {
  category?: string;
}

const getChildNodes = (node: ErrorKeypointNode) => {
  return node.childrenLabels || node.children || [];
};

const collectQuestionIds = (nodes: ErrorKeypointNode[] = []): string[] => {
  const ids = nodes.reduce<string[]>((list, node) => {
    const currentIds = (node.questionIds || []).map((id) => String(id));
    const childIds = collectQuestionIds(getChildNodes(node));
    return list.concat(currentIds, childIds);
  }, []);

  return Array.from(new Set(ids.filter(Boolean)));
};

const getNodeQuestionCount = (node: ErrorKeypointNode) => {
  return (
    node.wrongCount ||
    node.count ||
    node.questionIds?.length ||
    collectQuestionIds(getChildNodes(node)).length
  );
};

const getNodeCategoryId = (node: ErrorKeypointNode) => {
  return node.categoryId || node.keypointId || node.id;
};

const toTreeData = (
  nodes: ErrorKeypointNode[] = [],
  onStartPractice: (node: ErrorKeypointNode) => void,
  parentKey = "error",
): ErrorTreeNode[] => {
  return nodes.map((node, index) => {
    const children = getChildNodes(node);
    const count = getNodeQuestionCount(node);
    const key = `${parentKey}-${node.id || index}`;
    const title = (
      <Flex
        className="error-tree-node-title"
        justify="space-between"
        align="center"
      >
        <span className="error-tree-node-text">
          {node.name || "未命名"} ({count})
        </span>
        <Button
          className="error-tree-node-action"
          size="small"
          disabled={!count}
          onClick={(event) => {
            event.stopPropagation();
            onStartPractice(node);
          }}
        >
          开始练习
        </Button>
      </Flex>
    );

    return {
      key,
      title,
      children: toTreeData(children, onStartPractice, key),
    };
  });
};

const getTotalQuestionCount = (nodes: ErrorKeypointNode[] = []) => {
  const ids = collectQuestionIds(nodes);
  if (ids.length) return ids.length;

  return nodes.reduce((total, node) => total + getNodeQuestionCount(node), 0);
};

export const Errors = () => {
  const [messageApi, messageHolder] = message.useMessage();
  const [loading, setLoading] = React.useState(true);
  const [treeData, setTreeData] = React.useState<ErrorTreeNode[]>([]);
  const [questionCount, setQuestionCount] = React.useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const { setting } = useSetting();
  const routeState = (location.state || {}) as ErrorsLocationState;
  const category =
    routeState.category || setting.categoryId || SELECTENUM.XINGCE;

  const startPractice = React.useCallback(
    (node: ErrorKeypointNode) => {
      const total = getNodeQuestionCount(node);

      const categoryId = getNodeCategoryId(node);

      if (!categoryId || !total) {
        messageApi.info("当前知识点暂无可练习错题");
        return;
      }

      navigate("/errors-detail", {
        state: {
          category,
          categoryId,
          errorTotal: total,
          errorPageSize: 10,
          fallbackQuestionIds: collectQuestionIds([node]),
          title: node.name || "我的错题",
        },
      });
    },
    [category, messageApi, navigate],
  );

  React.useEffect(() => {
    vscode.postMessage({
      command: "getErrorKeypointTree",
      postData: {
        category,
      },
    });
  }, [category]);

  useVscodeMessage(
    React.useCallback(
      (event) => {
        if (event.command === "message") {
          setLoading(false);
          messageApi.info((event.data as { message?: string })?.message || "");
        }

        if (event.command === "errorKeypointTree") {
          const data = (event.data as ErrorKeypointNode[]) || [];
          setTreeData(toTreeData(data, startPractice));
          setQuestionCount(getTotalQuestionCount(data));
          setLoading(false);
        }
      },
      [messageApi, startPractice],
    ),
  );

  const onBack = () => {
    navigate(-1);
  };

  return (
    <div className="detail_page">
      <Spin tip="loading..." spinning={loading}>
        <div className="question-container error-question-page">
          <div className="top-bar">
            <Button type="text" onClick={onBack}>
              返回上一页
            </Button>
          </div>

          <Flex
            justify="space-between"
            align="center"
            gap={8}
            className="error-question-header"
          >
            <div>
              <div className="error-question-title">我的错题</div>
              <div className="error-question-subtitle">
                按知识点归类，共 {questionCount} 题
              </div>
            </div>
          </Flex>

          {treeData.length > 0 && (
            <div className="error-tree-container">
              <CustomTree treeData={treeData} />
            </div>
          )}

          {!treeData.length && !loading ? (
            <Empty description="暂无错题" />
          ) : null}
        </div>
      </Spin>

      {messageHolder}
    </div>
  );
};
