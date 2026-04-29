import { PlayCircleOutlined, SendOutlined } from "@ant-design/icons";
import { Button, Flex } from "antd";
import * as React from "react";

const normalizeNode = (item: any) => {
  const children = item.children || item.childrenLabels || [];
  const count = item.count ?? item?.labelMeta?.paperCount ?? 0;
  const answerCount = item.answerCount ?? 0;
  return {
    ...item,
    children,
    count,
    answerCount,
  };
};

export const modifyArrayToTree = (
  arr: any[],
  cacheResult: any = {},
  callback?: (item: any, cacheKey: any[]) => void,
  level = 1
) => {
  return arr.map((rawItem) => {
    const item = normalizeNode(rawItem);
    const isContinue = cacheResult?.keypointIds?.includes(item.id);

    const actionBtn = (
      <Button
        size="small"
        // style={{ marginLeft: 20 }}
        onClick={(e) => {
          e.stopPropagation(); // ❗ 防止触发 Tree 的展开行为
          callback && callback(item, cacheResult);
        }}
      >
        {isContinue ? "继续练习" : "去练习"}
      </Button>
    );

    // title 内容区域
    const title = (
      <div>
        <Flex justify="space-between" align="center" style={{ width: "100%" }}>
          <span>
            {item.name} ({item.answerCount}/{item.count})
          </span>
          {actionBtn}
        </Flex>
      </div>
    );

    const node: any = {
      title,
      key: item.id,
      // selectable: false, // ❗点击节点只用于展开，不选中
    };

    if (item.children?.length) {
      node.children = modifyArrayToTree(
        item.children,
        cacheResult,
        callback,
        level + 1
      );
    }

    return node;
  });
};

