## 1. 分类与路由映射

- [x] 1.1 在 `src/views/utils/constant.ts` 新增 `sydwms` 分类选项（文案与 value）并确保下拉可选。
- [x] 1.2 新增统一分类映射（category -> courseSetPrefix/routecs/tikuPrefix/answerMode），替换散落的硬编码分支。
- [x] 1.3 调整 `changeCategory` 与 `courseSetChange` 入参来源，改为使用映射后的 courseSetPrefix。

## 2. 事业单位目录与取题链路

- [x] 2.1 在 `src/utils/service.ts` 明确 `sydw` 目录接口（`/api/sydw/comptroller/subLabels`）返回结构适配。
- [x] 2.2 增加 `subLabels` 数据到树组件数据结构的转换，确保 `childrenLabels` 可递归展示。
- [x] 2.3 校准 `getQuestion/getQuickQuestion/getExercisesId/getExercisesUrl` 的分类参数传递，确保 `sydw` 与 `sydwms` routecs 一致。

## 3. 答题、提交与历史流程

- [x] 3.1 在 `src/api/webviewHandle.ts` 的 `inc` 中将 `sydwms` 走主观题分支（`type=204 + answer`），`sydw` 保持客观题分支（`type=201 + choice`）。
- [x] 3.2 校准 `studyTime` 上报 `tikuPrefix` 来源，改为映射值，避免分类错传。
- [x] 3.3 校准 `history/getCache/submit/getSolution` 的分类参数，确保 `sydw` 与 `sydwms` 均可返回有效数据。

## 4. 前端交互与回归验证

- [x] 4.1 更新 `src/views/pages/Index.tsx` 分类切换后初始化与历史请求参数，移除魔法数字并与映射一致。
- [x] 4.2 在 `src/views/pages/Detail.tsx` 与 `src/views/pages/Answer.tsx` 验证 `sydwms` 显示和提交流程与申论兼容。
- [ ] 4.3 手工回归四类场景：`xingce`、`shenlun`、`sydw`、`sydwms` 的取题、作答、提交、解析、历史。
