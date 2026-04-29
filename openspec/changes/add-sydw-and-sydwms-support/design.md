## Context

当前插件在 UI 分类中已包含 `sydw`，但主流程主要按 `xingce/shenlun` 模式构建。通过 agent-browser 对 `https://www.fenbi.com/spa/tiku/guide/catalog/sydw?prefix=syzc` 的抓取可确认：事业单位链路使用 `sydw/comptroller` 目录接口，且存在 course set 维度（`sydw`、`zhyynl`、`sydwms`），其中 `supportCourseSet` 明确返回 `sydwms` 入口。现有实现在 `src/utils/service.ts` 与 `src/api/webviewHandle.ts` 中对分类参数、题型上报与目录转换仍是通用逻辑，导致事业单位笔试与事业单位申论无法稳定走通。

约束：
- 不破坏既有 `xingce`/`shenlun` 行为。
- 维持现有 webview 消息协议（`pageInit/getQuestion/submit/history/...`）以避免大面积重构。
- 以最小侵入方式接入新分类，优先复用现有页面与组件。

## Goals / Non-Goals

**Goals:**
- 让“事业单位笔试（sydw）”完整支持目录展示、取题、答题、提交、解析、历史。
- 新增“事业单位申论（sydwms）”分类并打通与申论题型一致的主观题提交流程。
- 建立统一的分类路由映射，稳定产出 `courseSetPrefix`、`routecs`、`tikuPrefix` 与答题载荷类型。

**Non-Goals:**
- 不新增独立页面或全新状态管理方案。
- 不改造后端接口协议。
- 不覆盖事业单位全部子赛道（如 zhyynl 仅保留可扩展入口，不在本次强制打通）。

## Decisions

1. 引入“分类能力映射表”作为单一真相源
- 决策：在前端常量层定义每个分类的能力（目录接口类型、答题类型、routecs/tikuPrefix/courseSetPrefix）。
- 原因：当前逻辑散落在 `service.ts` 与 `webviewHandle.ts` 的 if/else，新增 `sydwms` 后容易遗漏。
- 备选方案：继续分散 if/else；被否决，因为维护成本高、回归风险大。

2. `sydw` 目录采用 `subLabels + papers` 二段式组装
- 决策：保持 `getCategories('sydw')` 调 `subLabels`，并将其映射为现有树组件可消费结构；点击节点后继续走现有 `getExercisesId`/`combine` 链路。
- 原因：抓包结果显示 `subLabels` 返回标签树（含 `childrenLabels`），`papers` 返回卷列表（含 `combineKey`），与现有“树 + 练习”模型可对齐。
- 备选方案：直接以 `papers` 平铺替代树；被否决，因为会丢失专项层级。

3. `sydwms` 复用申论主观题提交流程
- 决策：在 `inc` 中将 `sydwms` 与 `shenlun` 一样走 `type:204 + answer`；客观题继续 `type:201 + choice`。
- 原因：现有主观题组件与提交流程已稳定，复用可最小化变更。
- 备选方案：单独新建 `sydwms` 题型分支；被否决，因为与 `shenlun` 结构高度重复。

4. 分类切换时同步调用 `courseSetChange`
- 决策：保留 `changeCategory -> courseSetChange`，并将其参数改为能力映射后的 `courseSetPrefix`，而非直接使用 UI value。
- 原因：抓包显示事业单位页面依赖 course set 上下文（`supportCourseSet?courseSetPrefix=sydw,zhyynl,sydwms`）。
- 备选方案：不调用 `courseSetChange`；被否决，可能导致服务端上下文与题库前缀不一致。

## Risks / Trade-offs

- [风险] `sydw`/`sydwms` 在部分接口上可能并非完全对称于 `xingce/shenlun` → 缓解：将分类映射集中配置并对每条链路加最小必要分支。
- [风险] 目录数据结构与树组件字段不一致导致空白菜单 → 缓解：在 `modifyArrayToTree` 前增加适配层，并用真实 `subLabels` 样本回归。
- [风险] 历史接口对 `categoryId` 语义不同（现有硬编码值较多）→ 缓解：统一从分类映射中导出历史查询参数，移除页面内魔法数字。
- [权衡] 先以可用性优先复用申论页面，短期会牺牲 `sydwms` 专属交互定制空间。
