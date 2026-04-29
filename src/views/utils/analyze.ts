export const groupByMaterialIndexesTo2DArray = <
  T extends { materialIndexes?: number[] | null },
>(
  dataArray: T[],
): T[][] => {
  const groups = dataArray.reduce<Record<string, T[]>>((acc, item) => {
    // 如果 materialIndexes 为空或不存在，将它们归为 'noIndexes' 组
    const key =
      item.materialIndexes && item.materialIndexes.length > 0
        ? item.materialIndexes.join(",")
        : "noIndexes";

    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key].push(item);

    return acc;
  }, {});

  // 将对象转换为二维数组
  return Object.values(groups);
};
