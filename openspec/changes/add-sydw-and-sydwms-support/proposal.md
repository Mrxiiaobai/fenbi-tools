## Why

当前插件虽然在分类中已出现“事业单位笔试（sydw）”，但练习链路仍沿用公务员/申论接口模型，且缺少“事业单位申论（sydwms）”入口与题型适配，导致用户无法完整使用事业单位场景的专项练习。现在需要对齐粉笔线上实际接口（sydw comptroller 系列与 courseSet 切换），把事业单位笔试与事业单位申论都纳入同一套可用流程。

## What Changes

- 新增“事业单位申论（sydwms）”分类入口，并完善分类切换逻辑。
- 对事业单位目录/专项练习接入 `sydw/comptroller` 相关接口，并按返回结构转换为现有树形菜单。
- 扩展取题、做题、提交、解析、历史、学习时长上报等流程，使 `sydw` 与 `sydwms` 都能走通。
- 按分类差异处理答题载荷（客观题 vs 主观题）与参数（如 routecs/tikuPrefix/courseSetPrefix）。
- 保持现有 `xingce`、`shenlun` 行为不变，避免回归。

## Capabilities

### New Capabilities
- `sydw-objective-practice`: 支持事业单位笔试（sydw）从目录到练习、交卷、解析、历史的完整闭环。
- `sydw-essay-practice`: 支持事业单位申论（sydwms）分类切换、取题与主观题答题/提交流程。
- `fenbi-course-set-routing`: 统一分类到 `courseSetPrefix` / `routecs` / `tikuPrefix` 的路由映射，确保不同考试线走对后端接口。

### Modified Capabilities
- 无（当前仓库尚无既有 OpenSpec capability 需要做 delta）。

## Impact

- 受影响模块：`src/utils/service.ts`、`src/api/webviewHandle.ts`、`src/views/pages/Index.tsx`、`src/views/utils/constant.ts`、答题页相关组件。
- 受影响接口：`/api/sydw/comptroller/subLabels`、`/api/sydw/comptroller/papers`、`/api/sydw/comptroller/supportCourseSet`，以及既有 combine/exercise 与 activity/report 接口的分类参数。
- 受影响行为：分类切换后菜单数据结构、历史记录查询分类、答题上报参数。
