export const setImg = (str: string) => {
  if (!str) return str;
  let _str = str.replace(
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

  // 2. 移除 width="" 或 width='' 属性
  _str = _str.replace(/\swidth\s*=\s*(['"])[^'"]*\1/gi, "");

  // 3. 移除 height="" 或 height='' 属性
  _str = _str.replace(/\sheight\s*=\s*(['"])[^'"]*\1/gi, "");

  return _str;
};
