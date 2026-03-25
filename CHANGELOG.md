# Changelog

All notable changes to Vimlypond will be documented in this file.

## [v0.8.0] - 2025-01-17

### Added
- **跨小节延音线渲染** - 支持渲染跨小节的延音线
  - 新增 `createCrossMeasureTies()` 函数
  - 延音线现在可以正确连接相邻小节的音符

### Changed
- 重构渲染流程，收集所有音符引用用于跨小节延音线处理

### Tests
- 新增 2 个跨小节延音线测试用例

## [v0.7.0] - 2025-01-17

### Added
- **拍号变更** - 支持设置和切换拍号
  - 新增 `MeterName` 类型定义
  - 支持常用拍号：2/4, 3/4, 4/4, 5/4, 6/4, 7/4, 2/2, 3/2, 4/2, 3/8, 6/8, 9/8, 12/8
  - 新增 `changeMeter()` 函数切换拍号
  - 新增 `getMeasureCapacity()` 计算小节容量

### Changed
- 新增拍号相关辅助函数：`getMeter()`, `getMeasureCapacity()`

### Tests
- 新增 4 个拍号测试用例

## [v0.6.0] - 2025-01-17

### Added
- **调号支持** - 支持设置和切换调号
  - 新增 `KeySignature` 和 `KeySignatureName` 类型定义
  - 支持所有常用调号（15 个大调 + 15 个小调）
  - 新增 `changeKeySignature()` 函数切换调号
  - 音符输入自动应用调号中的升降号（如 G 大调中 F 自动变为 F#）
  - 调号信息存储在 Staff 级别

### Changed
- `Staff` 类型添加 `keySignature` 字段
- `insertNote()` 现在根据调号自动添加升降号
- 新增调号相关辅助函数：`getKeySignature()`, `getAlterForKey()`, `getKeySignatureNotes()`

### Tests
- 新增 6 个调号测试用例

## [v0.5.0] - 2025-01-17

### Added
- **和弦输入功能** - 支持在同一位置输入多个音高形成和弦
  - 插入模式下 `Shift + 音符键(a-g)` 添加音高到当前音符
  - 和弦音高自动排序（从低到高）
  - 重复音高检测和提示
  - 新增 `Pitch` 类型定义 (`types.ts`)
  - 新增 `addToChord()` 函数 (`store.ts`)
  - 支持重复操作（普通模式下 `.` 重复添加音高）

### Changed
- **Note 类型重构** - 支持多音高
  - `Note.midiPitch` → `Note.pitches: Pitch[]`
  - `Note.alter` → `Pitch.alter`（移入 pitches 数组）
  - 单音：`pitches` 数组包含 1 个元素
  - 和弦：`pitches` 数组包含多个元素

- **函数更新适配 pitches 数组**
  - `createNote()` 返回单 pitches 数组
  - `makeSharp/makeFlat` 修改最后一个音高
  - `raiseOctave/lowerOctave` 修改所有音高
  - `generateLilyPond()` 支持和弦导出 (`<c e g>4`)
  - `getLastMidiPitch()` 返回最高音高
  - `mergeTiedNotes()` 比较 pitches 数组
  - VexFlow 渲染支持多音高

### Fixed
- 所有测试用例更新适配新的 Note 类型结构

## [v0.4.0] - 2025-01-16

### Added
- **Vim 重复操作** (`.` 键) - 普通模式下按 `.` 重复上次修改操作
  - 支持重复操作类型：
    - `deleteElement` - 删除元素
    - `modifyDuration` - 修改时值
    - `addDot` - 添加附点
    - `makeSharp` / `makeFlat` - 升降号
    - `raiseOctave` / `lowerOctave` - 八度变化
    - `toggleClef` - 切换谱号
    - `insertNote` / `insertRest` - 插入音符/休止符（预留支持）
  - 新增 `RepeatableAction` 类型定义 (`types.ts`)
  - 新增 `lastAction` 状态和 `repeatLastAction()` 函数 (`store.ts`)
  - 普通模式下 `.` 键绑定 (`VimlypondEditor.tsx`)

- **Vim 重做** (`Ctrl+R`)
  - 新增 `redo()` 函数 (`store.ts`)
  - 支持 `Ctrl+R` 重做已撤销的操作

### Changed
- 扩展 i18n 翻译：添加 `toastRedo` 翻译

### Tests
- 新增 10 个重复操作测试用例 (`store.test.ts`)
  - 无操作时按 `.` 无效果
  - 重复删除、修改时值、添加附点、升降号、八度变化、切换谱号
- 新增 6 个重做功能测试用例 (`store.test.ts`)
  - 无撤销历史时重做无效
  - 撤销后重做恢复操作
  - 多次撤销后多次重做
  - 新操作清空重做历史（Vim 行为）
  - 撤销添加谱表/删除后重做

## [v0.3.0] - 2025-01-16

### Changed
- **类型安全重构** (`src/lib/vimlypond/renderer.ts`)
  - 新增 `vexflow-types.ts` VexFlow 类型定义文件
  - 消除所有 `as unknown as` 链式断言
  - 提取辅助函数：`createStave`, `createNotesFromMeasure`, `createTiesFromMeasure`, `collectNoteRects`
  - 使用类型安全的 `getVexFlow()` 和 `isVexFlowReady()` 函数

### Fixed
- 修复测试隔离问题：`store.test.ts` 添加顶层 `beforeEach` 重置状态

## [v0.2.5] - 2025-01-16

### Added
- 添加"专家责任"原则：
  - 用户不懂代码，专家自行解决复杂问题
  - 用户提供意图，专家提供方案
  - 复杂问题内部消化，技术决策自行判断
  - 遇到歧义主动沟通，但不推卸解决责任

## [v0.2.4] - 2025-01-16

### Changed
- 修改核心原则表述：
  - 删除"只要求结果"的封闭表述
  - 改为"大胆发挥，坦诚沟通"的开放态度
  - 添加"敢于提出专业建议，不盲从需求"

## [v0.2.3] - 2025-01-16

### Added
- 扩展专业背景定义：
  - 音乐理论：和声学、对位法、各时期记谱惯例
  - LilyPond 生态：十年以上经验，精通语法与高级特性
  - Vim 操作：肌肉记忆级别的模态编辑能力
- 添加 Vim 概念到乐谱操作的映射表

## [v0.2.2] - 2025-01-16

### Changed
- 更新开发规范，添加核心原则：
  - 以行业顶尖专家标准要求自己
  - 不找借口，只交付结果
  - 追求简洁优雅，拒绝过度工程

## [v0.2.1] - 2025-01-16

### Added
- **开发规范文档** (`DEVELOPMENT.md`)
  - 版本号规范（语义化版本）
  - 版本标签管理流程
  - 更新日志规范
  - 提交信息规范（Conventional Commits）
  - 开发流程指南
  - 发布前检查清单

## [v0.2.0] - 2025-01-16

### Added

#### 流式推拉平衡系统 (`src/lib/vimlypond/music.ts`)
- `splitNoteWithDuration()` - 分割音符并自动添加延音线标记
- `mergeTiedNotes()` - 合并延音线音符，消除延音线
- `balanceMeasures()` - 小节时值平衡主函数
- `tryMergeFromPrevious()` - 尝试从前一小节拉取元素
- `pushElementToNext()` - 将元素推送到下一小节
- `pullFromNext()` - 从下一小节拉取元素
- `fillWithRests()` - 用休止符填充小节

#### 延音线渲染支持 (`src/lib/vimlypond/renderer.ts`)
- 使用 VexFlow `StaveTie` 渲染延音线
- 自动检测 `tieStart`/`tieEnd` 标记对
- 小节内延音线正确显示

#### 测试覆盖
- `stream-balance.test.ts` - 14个测试用例覆盖分割、合并、推拉、连锁操作
- `normal-mode-duration.test.ts` - 修改时值触发小节平衡测试

### Changed
- `modifyDuration()` 和 `addDot()` 现在会自动触发 `balanceMeasures()`
- 修改音符时值后自动平衡小节

### Fixed
- 修复分割后被自动合并导致溢出的问题
- 修复 `tieStart`/`tieEnd` 方向错误（第一个音符应为 tieStart）
- 修复推送 tieEnd 音符时延音线残留的问题
- 移除未使用的 `Stem` 类型定义
- 移除调试日志

### Limitations
- 延音线渲染目前仅支持小节内，跨小节延音线需要额外处理

## [v0.1.0] - 2025-01-15

### Added

#### 核心架构
- Vim 风格模态乐谱编辑器基础架构
- 双模式系统：普通模式（Normal）和插入模式（Insert）
- VexFlow 实时渲染引擎
- Zustand 状态管理

#### 音符输入与编辑 (`src/lib/vimlypond/store.ts`)
- **音符输入**: `a-g` 音名输入，智能八度推断
- **休止符**: `r` 插入休止符
- **时值修改**: `1, 2, 4, 8, 16` 修改音符时值
- **附点**: `.` 添加附点
- **升降号**: `+/-` 添加升号/降号
- **八度**: `'/,` 升/降八度

#### 导航功能
- `h/l` - 小节内音符间导航
- `j/k` - 谱表间导航
- `n/b` - 小节间导航（下一小节/上一小节）

#### 乐谱操作
- `o/O` - 在下方/上方添加新谱表
- `t` - 切换谱号（高音/低音）
- `x` - 删除元素
- `u` - 撤销操作

#### UI/UX (`src/components/vimlypond/VimlypondEditor.tsx`)
- **顶部栏**: 模式指示器、谱表/小节/谱号状态显示
- **底部快捷键栏**: 合并显示相关快捷键（如 `j/k`、`h/l`）
- **帮助面板**: 右侧滑出式帮助面板，`?` 快捷键触发
- **输入预览**: 插入模式下显示上次输入的音符信息
- **Toast 提示**: 操作反馈提示
- **响应式设计**: 支持不同屏幕尺寸

#### 国际化 (`src/lib/vimlypond/i18n.ts`)
- 中文/英文双语支持
- 语言切换按钮
- 本地存储语言偏好

#### 导出功能 (`src/lib/vimlypond/music.ts`)
- LilyPond 格式导出（`.ly` 文件）
- 支持多谱表、谱号、升降号

#### 数据持久化
- LocalStorage 自动保存
- 乐谱状态恢复
- 光标位置恢复

#### 测试覆盖
- 音高计算测试
- 时值计算测试
- 八度推断测试
- 导航功能测试
- 插入模式测试
