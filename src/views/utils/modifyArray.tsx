import { Button, Flex } from "antd";
import { DataNode } from "antd/es/tree";
import * as React from "react";
import { CacheData, CategoryNode } from "../../shared/types";

type NormalizedCategoryNode = CategoryNode & {
  children: CategoryNode[];
  count: number;
  answerCount: number;
};

const normalizeNode = (item: CategoryNode): NormalizedCategoryNode => {
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
  arr: CategoryNode[],
  cacheResult: CacheData = {},
  callback?: (item: CategoryNode, cacheResult: CacheData) => void,
): DataNode[] => {
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

    const node: DataNode = {
      title,
      key: item.id,
    };

    if (item.children?.length) {
      node.children = modifyArrayToTree(
        item.children,
        cacheResult,
        callback,
      );
    }

    return node;
  });
};
