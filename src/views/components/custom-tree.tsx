import { Tree } from "antd";
import { DataNode } from "antd/es/tree";
import * as React from "react";
import { DownOutlined } from "@ant-design/icons";

export function CustomTree({ treeData }: { treeData: DataNode[] }) {
  const [expandedKeys, setExpandedKeys] = React.useState<React.Key[]>([]);

  const onSelect = (_keys: React.Key[], selectedNodes: { node?: DataNode }) => {
    const key = selectedNodes.node?.key;
    if (!selectedNodes?.node?.children) return;

    setExpandedKeys((prev) => {
      // 如果已展开，则关闭
      if (prev?.includes(key)) {
        return prev.filter((k) => k !== key);
      }

      // 如果未展开，则展开
      return [...prev, key];
    });
  };

  return (
    <Tree
      showIcon
      switcherIcon={<DownOutlined />}
      treeData={treeData}
      style={{ minWidth: 256, maxWidth: 300 }}
      onSelect={onSelect}
      expandedKeys={expandedKeys}
      onExpand={(keys) => setExpandedKeys(keys)}
    />
  );
}
