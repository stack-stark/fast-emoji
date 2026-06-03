# Fast-Emoji 重构方案技术文档

> 版本：1.0  
> 日期：2026-06-02  
> 适用项目：fast-emoji v1.1.4

---

## 一、现状分析

### 1.1 项目概况

fast-emoji 是一个 VS Code 扩展插件，通过在编辑区输入匹配前缀（默认 `000`）+ 中文名称自动替换为 emoji 字符。内置 3000+ emoji 数据，按 9 个分类存放。

### 1.2 当前架构

```
src/
├── extension.ts              # 唯一逻辑入口（65 行）
├── constants/
│   ├── emoji.ts              # 数据汇总（20 行）
│   ├── activity.ts           # 活动类（342 行）
│   ├── body.ts               # 身体类（9042 行）
│   ├── emote.ts              # 表情类（674 行）
│   ├── flag.ts               # 旗帜类（1078 行）
│   ├── food.ts               # 食物类（542 行）
│   ├── goods.ts              # 物品类（1050 行）
│   ├── journey.ts            # 旅行类（874 行）
│   ├── sign.ts               # 符号类（894 行）
│   └── zoon.ts               # 动物类（614 行）
└── test/
    └── extension.test.ts     # 占位测试（15 行）
```

### 1.3 数据规模

| 文件 | 行数 | 占比 |
|------|------|------|
| body.ts | 9042 | 60.7% |
| flag.ts | 1078 | 7.2% |
| goods.ts | 1050 | 7.0% |
| sign.ts | 894 | 6.0% |
| journey.ts | 874 | 5.9% |
| emote.ts | 674 | 4.5% |
| zoon.ts | 614 | 4.1% |
| food.ts | 542 | 3.6% |
| activity.ts | 342 | 2.3% |
| emoji.ts | 20 | 0.1% |
| **合计** | **~14,930** | **100%** |

---

## 二、问题清单

### 2.1 🔴 严重问题（影响功能正确性）

#### P1：`insertEmoji` 使用 `lastIndexOf` 导致多光标/多匹配场景替换位置错误

```typescript
// extension.ts 第 27-30 行
const replaceRange = new vscode.Range(
  editor.document.positionAt(
    editor.document.getText().lastIndexOf(match[0])  // ← 总是取最后一个匹配
  ),
  editor.selection.start
);
```

**问题**：当文档中存在多个相同的前缀+名称文本时，`lastIndexOf` 会定位到最后一个出现的位置，而非当前光标所在位置。这会导致替换发生在错误的位置。

**复现场景**：
1. 文档中有两行 `000笑脸`
2. 光标在第一行时输入空格触发替换
3. 第二行的 `000笑脸` 被替换，而非第一行

#### P2：正则未转义前缀特殊字符

```typescript
const match = lineText.match(
  new RegExp(`${prefix}([\\u4e00-\\u9fa5]+)(?=\\s|$)`)
);
```

**问题**：如果用户将前缀配置为含有正则特殊字符的字符串（如 `+`、`*`、`$`、`(` 等），正则构造会失败或产生意外匹配。

#### P3：`onDidChangeTextEditorSelection` 事件触发过于频繁

**问题**：该事件在光标任何移动时都会触发（包括鼠标点击、方向键移动等），每次触发都会执行正则匹配和文本扫描。在编辑大文件时可能造成性能问题，且存在误触发替换的风险（如光标经过已有文本中的 `000笑脸` 时）。

### 2.2 🟡 中等问题（影响可维护性与体验）

#### P4：所有逻辑集中在单一函数中，职责不清

[extension.ts](file:///c:/Users/M/Documents/codes/fast-emoji/src/extension.ts) 中 `activate` 函数同时承担了事件监听、文本解析、emoji 查找、文本替换四项职责，违反单一职责原则。

#### P5：emoji 查找使用线性扫描，O(n) 复杂度

```typescript
const emoji = EMOJI_DATA.find((item) => item.name === emojiName);
```

**问题**：3000+ 条数据使用 `Array.find` 线性查找，每次替换都要遍历数组。应使用 Map/Set 实现O(1)查找。

#### P6：数据类型定义薄弱

```typescript
export const EMOJI_DATA: Array<{ name: string; emoji: string }> = [...]
```

**问题**：缺少 `EmojiItem` 接口定义，缺少分类信息，各分类文件的导出类型隐式推导。

#### P7：测试几乎为空

```typescript
test('Sample test', () => {
  assert.strictEqual(-1, [1, 2, 3].indexOf(5));
  assert.strictEqual(-1, [1, 2, 3].indexOf(0));
});
```

**问题**：测试用例与项目逻辑完全无关，没有任何核心功能的测试覆盖。

#### P8：`console.log` 遗留在生产代码中

```typescript
function insertEmoji(editor: vscode.TextEditor, emojiName: string): void {
  console.log(emojiName);  // ← 调试代码未清理
```

#### P9：文件命名不规范

`zoon.ts` 应为 `zoo.ts`（动物类），当前拼写为 "zoon"（名词：胎盘），属于拼写错误。

### 2.3 🟢 轻微问题（影响代码质量）

#### P10：数据文件格式冗余

每条 emoji 数据占 5 行：

```typescript
{
  name: "闪亮",
  emoji: "✨",
},
```

可压缩为单行格式，减少约 60% 的数据文件体积。

#### P11：缺少配置变更监听

用户修改 `fast-emoji.prefix` 配置后，需要重启 VS Code 才能生效，缺少 `onDidChangeConfiguration` 监听。

#### P12：仅支持中文匹配

正则 `[\\u4e00-\\u9fa5]+` 限制了只能匹配中文字符，不支持英文/日文等其他语言的 emoji 名称。

#### P13：缺少 emoji 搜索/预览功能

用户需要记住 emoji 的中文名才能使用，没有提供搜索、预览或自动补全等辅助功能。

---

## 三、重构目标

| 维度 | 目标 |
|------|------|
| 正确性 | 修复多匹配替换位置错误、正则注入等 Bug |
| 性能 | emoji 查找从 O(n) 优化到 O(1) |
| 可维护性 | 模块化拆分，职责分离，完善类型定义 |
| 体验 | 支持自动补全、预览面板、配置热更新 |
| 质量 | 核心功能测试覆盖率达到 80%+ |

---

## 四、重构方案

### 4.1 架构重构：模块化拆分

#### 目标目录结构

```
src/
├── extension.ts              # 插件入口：仅负责注册和协调
├── config.ts                 # 配置管理：读取/监听配置变更
├── matcher.ts                # 文本匹配：正则构建与文本解析
├── replacer.ts               # 文本替换：范围计算与编辑器操作
├── provider.ts               # 自动补全提供者：CompletionItemProvider
├── constants/
│   ├── emoji.ts              # 数据汇总 + Map 构建
│   ├── types.ts              # 类型定义
│   ├── activity.ts
│   ├── body.ts
│   ├── emote.ts
│   ├── flag.ts
│   ├── food.ts
│   ├── goods.ts
│   ├── journey.ts
│   ├── sign.ts
│   └── zoo.ts                # 修正命名 zoon → zoo
└── test/
    ├── extension.test.ts
    ├── matcher.test.ts
    ├── replacer.test.ts
    └── provider.test.ts
```

#### 各模块职责

| 模块 | 职责 | 依赖 |
|------|------|------|
| `extension.ts` | 插件激活/停用，注册命令和提供者 | config, matcher, replacer, provider |
| `config.ts` | 读取 `fast-emoji.prefix`，监听配置变更，缓存配置值 | vscode |
| `matcher.ts` | 构建正则，解析当前行文本，提取 emoji 名称 | config |
| `replacer.ts` | 计算替换范围，执行编辑器文本替换 | vscode, constants/emoji |
| `provider.ts` | 实现 `CompletionItemProvider`，提供自动补全 | config, constants/emoji |
| `constants/types.ts` | 定义 `EmojiItem`、`EmojiCategory` 等类型 | 无 |
| `constants/emoji.ts` | 汇总数据，构建查找 Map | constants/* |

### 4.2 Bug 修复

#### 4.2.1 修复替换位置错误（P1）

**方案**：基于光标位置计算替换范围，而非使用 `lastIndexOf` 全文搜索。

```typescript
// replacer.ts
function replaceEmoji(editor: vscode.TextEditor, selection: vscode.Selection): void {
  const line = editor.document.lineAt(selection.start.line);
  const lineText = line.text;
  const prefix = getConfig().prefix;
  const regex = buildMatchRegex(prefix);
  const match = lineText.match(regex);

  if (!match || !match[1]) return;

  const emojiName = match[1];
  const emoji = emojiMap.get(emojiName);
  if (!emoji) return;

  const matchStart = lineText.indexOf(match[0]);
  const matchEnd = matchStart + match[0].length;

  const replaceRange = new vscode.Range(
    new vscode.Position(selection.start.line, matchStart),
    new vscode.Position(selection.start.line, matchEnd)
  );

  editor.edit((builder) => {
    builder.replace(replaceRange, emoji);
  });
}
```

**关键改进**：
- 使用行级匹配替代全文匹配
- 基于行内偏移量精确定位替换范围
- 不再依赖 `lastIndexOf`，避免多匹配冲突

#### 4.2.2 修复正则注入（P2）

**方案**：对前缀进行正则转义。

```typescript
// matcher.ts
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildMatchRegex(prefix: string): RegExp {
  const escaped = escapeRegex(prefix);
  return new RegExp(`${escaped}([\\u4e00-\\u9fa5a-zA-Z]+)(?=\\s|$)`);
}
```

#### 4.2.3 优化事件触发机制（P3）

**方案 A（推荐）**：改用 `CompletionItemProvider` 自动补全机制

```typescript
// provider.ts
export class EmojiCompletionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.ProviderResult<vscode.CompletionItem[]> {
    const linePrefix = document.lineAt(position).text.substring(0, position.character);
    const prefix = getConfig().prefix;
    const escaped = escapeRegex(prefix);

    const match = linePrefix.match(new RegExp(`${escaped}([\\u4e00-\\u9fa5a-zA-Z]*)$`));
    if (!match) return undefined;

    const query = match[1];
    return EMOJI_DATA
      .filter(item => query === '' || item.name.startsWith(query))
      .map(item => {
        const completionItem = new vscode.CompletionItem(
          `${prefix}${item.name}`,
          vscode.CompletionItemKind.Text
        );
        completionItem.insertText = item.emoji;
        completionItem.detail = item.emoji;
        completionItem.documentation = `${item.name} ${item.emoji}`;
        completionItem.sortText = `0${item.name}`;
        return completionItem;
      });
  }
}
```

**优势**：
- 原生 VS Code 补全体验，支持模糊搜索、预览
- 不再依赖 `onDidChangeTextEditorSelection`，避免性能问题
- 用户可以看到候选列表，无需记住完整名称

**方案 B（保守）**：保留现有替换机制，但增加防抖和条件判断

```typescript
let lastReplaceTime = 0;
const DEBOUNCE_MS = 100;

const disposable = vscode.window.onDidChangeTextEditorSelection((event) => {
  const now = Date.now();
  if (now - lastReplaceTime < DEBOUNCE_MS) return;

  if (event.kind !== vscode.TextEditorSelectionChangeKind.Keyboard) return;
  // ... 原有逻辑
  lastReplaceTime = now;
});
```

### 4.3 性能优化

#### 4.3.1 查找数据结构优化（P5）

将 `Array<{name, emoji}>` 替换为 `Map<string, string>`，查找复杂度从 O(n) 降至 O(1)。

```typescript
// constants/emoji.ts
import { activity } from "./activity";
// ... 其他导入

const rawData: EmojiItem[] = [
  ...flag, ...body, ...activity, ...emotes,
  ...food, ...goods, ...journey, ...sign, ...zoo,
];

export const emojiMap: Map<string, string> = new Map(
  rawData.map(item => [item.name, item.emoji])
);

export const EMOJI_DATA: EmojiItem[] = rawData;
```

#### 4.3.2 数据文件压缩（P10）

将多行格式压缩为单行：

```typescript
// 压缩前（5 行/条）
{
  name: "闪亮",
  emoji: "✨",
},

// 压缩后（1 行/条）
{ name: "闪亮", emoji: "✨" },
```

预计数据文件总体减少约 60% 行数。

### 4.4 类型系统增强（P6）

```typescript
// constants/types.ts
export interface EmojiItem {
  name: string;
  emoji: string;
  category?: EmojiCategory;
}

export enum EmojiCategory {
  Activity = "activity",
  Body = "body",
  Emote = "emote",
  Flag = "flag",
  Food = "food",
  Goods = "goods",
  Journey = "journey",
  Sign = "sign",
  Zoo = "zoo",
}

export interface ExtensionConfig {
  prefix: string;
}
```

### 4.5 配置热更新（P11）

```typescript
// config.ts
let cachedConfig: ExtensionConfig;

export function initConfig(context: vscode.ExtensionContext): void {
  cachedConfig = readConfig();

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("fast-emoji.prefix")) {
        cachedConfig = readConfig();
      }
    })
  );
}

export function getConfig(): ExtensionConfig {
  return cachedConfig;
}

function readConfig(): ExtensionConfig {
  return {
    prefix: vscode.workspace.getConfiguration().get("fast-emoji.prefix") || "000",
  };
}
```

### 4.6 测试体系建立（P7）

#### 测试分层

| 层级 | 覆盖内容 | 框架 |
|------|----------|------|
| 单元测试 | matcher、replacer、config 的纯逻辑 | vitest / mocha |
| 集成测试 | provider 补全触发 | @vscode/test-electron |

#### 核心测试用例

```typescript
// matcher.test.ts
describe("Matcher", () => {
  it("应匹配默认前缀 + 中文名称", () => {
    const result = matchLine("000笑脸", "000");
    expect(result).toEqual({ prefix: "000", name: "笑脸" });
  });

  it("应匹配自定义前缀", () => {
    const result = matchLine(":笑脸", ":");
    expect(result).toEqual({ prefix: ":", name: "笑脸" });
  });

  it("应转义正则特殊字符前缀", () => {
    const result = matchLine("++笑脸", "++");
    expect(result).toEqual({ prefix: "++", name: "笑脸" });
  });

  it("不应匹配无前缀的中文", () => {
    const result = matchLine("笑脸", "000");
    expect(result).toBeNull();
  });
});

// replacer.test.ts
describe("Replacer", () => {
  it("应返回正确的替换范围", () => {
    // 模拟编辑器环境测试
  });

  it("不应在 emoji 不存在时执行替换", () => {
    const emoji = emojiMap.get("不存在的emoji");
    expect(emoji).toBeUndefined();
  });
});
```

---

## 五、新增功能建议

### 5.1 自动补全（推荐，优先级高）

基于 `CompletionItemProvider` 实现，提供以下体验：

- 输入前缀后自动弹出候选列表
- 支持模糊搜索和分类筛选
- 候选项显示 emoji 预览
- 选中后直接插入 emoji 字符

### 5.2 状态栏提示（优先级中）

在状态栏显示当前前缀配置，方便用户快速确认。

### 5.3 Emoji 面板（优先级低）

通过 Webview 实现侧边栏 emoji 浏览面板，支持分类浏览和搜索。

---

## 六、实施计划

### 阶段一：Bug 修复与基础重构

| 序号 | 任务 | 涉及问题 |
|------|------|----------|
| 1 | 修复替换位置计算逻辑 | P1 |
| 2 | 添加正则转义 | P2 |
| 3 | 模块化拆分（config / matcher / replacer） | P4 |
| 4 | 添加类型定义 | P6 |
| 5 | 移除 `console.log` | P8 |
| 6 | 重命名 `zoon.ts` → `zoo.ts` | P9 |

### 阶段二：性能与体验优化

| 序号 | 任务 | 涉及问题 |
|------|------|----------|
| 7 | 构建 Map 查找表 | P5 |
| 8 | 实现 CompletionItemProvider | P3, 5.1 |
| 9 | 配置热更新监听 | P11 |
| 10 | 数据文件格式压缩 | P10 |

### 阶段三：质量保障

| 序号 | 任务 | 涉及问题 |
|------|------|----------|
| 11 | 编写 matcher 单元测试 | P7 |
| 12 | 编写 replacer 单元测试 | P7 |
| 13 | 编写 provider 集成测试 | P7 |
| 14 | 支持英文/多语言匹配 | P12 |

---

## 七、风险评估

| 风险 | 等级 | 应对措施 |
|------|------|----------|
| CompletionItemProvider 与现有替换机制冲突 | 中 | 阶段二中两种机制并行，通过配置项切换 |
| 数据文件重命名影响 Git 历史 | 低 | 使用 `git mv` 保留历史 |
| 模块拆分后编译产物路径变化 | 低 | 更新 `.vscodeignore` 和 `package.json` 的 `main` 字段 |
| 自动补全在大型 emoji 数据集下的性能 | 中 | 实现防抖 + 限制候选数量 |

---

## 八、验收标准

1. 文档中存在多个相同 `前缀+名称` 时，替换发生在光标所在行
2. 前缀包含正则特殊字符时，匹配和替换正常工作
3. emoji 查找使用 Map，不再使用 `Array.find`
4. 代码按模块拆分，单一文件不超过 200 行（数据文件除外）
5. 核心逻辑（matcher / replacer）单元测试覆盖率 ≥ 80%
6. 修改前缀配置后无需重启即可生效
7. 无 `console.log` 等调试代码残留
