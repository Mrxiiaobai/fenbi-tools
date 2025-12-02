import { Tree } from "antd";
import * as React from "react";
import { DownOutlined } from "@ant-design/icons";

export function CustomTree({ treeData }: { treeData: any[] }) {
  const [expandedKeys, setExpandedKeys] = React.useState<any[]>([]);

  const onSelect = (keys: any, selectedNodes: any) => {
    const key = selectedNodes?.node?.key;
    if (!selectedNodes?.node?.children) return;

    setExpandedKeys((prev) => {
      // 如果已展开，则关闭
      if (prev.includes(key)) {
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
