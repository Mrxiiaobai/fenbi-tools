export const setImg = (str: string) => {
  const _str = str.replace(
    /(<img[^>]+src=\")([^"]+)/g,
    function (match: any, p1: string, p2: string) {
      // 如果 src 已经包含 https:，则不修改
      if (p2.startsWith("https:")) {
        return p1 + p2;
      }
      // 如果没有 https:，则添加
      return p1 + "https:" + p2;
    }
  );
  return _str;
};
