import { SendOutlined } from "@ant-design/icons";
import * as React from "react";
export const modifyArray = (arr: any, cacheKey: any, level = 1) => {
  return arr.map((item: any) => {
    // 修改属性名
    const newItem = {
      ...item,
      key: item.id,
      label: `${item.name} (${item.answerCount}/${item.count})`,
    };

    if (level > 1) {
      //   newItem.label = `${item.name} (${item.answerCount}/${item.count}) ${
      //     cacheKey?.includes(item.id) ? "【继续答题】" : ""
      //   }`;
      newItem.label = (
        <div>
          {item.name} ({item.answerCount}/{item.count})
          {cacheKey?.includes(item.id) ? (
            <span>
              【继续】
              <SendOutlined />
            </span>
          ) : null}
        </div>
      );
    }

    // 检查是否有子项
    if (item.children) {
      // 如果是第二级（level === 2），添加 "全部" 选项
      if (level === 1) {
        const allOption = {
          ...item,
          key: item.id, // 使用父级 key 作为 "全部" 选项的 key
          //   label: `全部 ${
          //     cacheKey?.includes(item.id) && cacheKey?.length == 1
          //       ? "【继续答题】"
          //       : ""
          //   }`,
          label: (
            <div>
              全部
              {cacheKey?.includes(item.id) && cacheKey?.length == 1 ? (
                <span>
                  【继续】
                  <SendOutlined />
                </span>
              ) : null}
            </div>
          ),
          children: null,
        };
        // 递归处理子项，并在第二级添加 "全部"
        newItem.children = [
          allOption,
          ...modifyArray(item.children, cacheKey, level + 1),
        ];
      } else {
        // 递归处理子项，递增级别
        newItem.children = modifyArray(item.children, cacheKey, level + 1);
      }
    }

    return newItem;
  });
};
