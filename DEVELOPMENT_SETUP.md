# 开发环境搭建指南

本文档说明如何重新搭建 VimlyPond-GLM 项目的开发环境。

## 前提条件

- Node.js 18+ 或 Bun 运行时
- Git

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd VimlyPond-GLM
```

### 2. 安装依赖

使用 Bun（推荐）：
```bash
bun install
```

或使用 npm：
```bash
npm install
```

或使用 pnpm：
```bash
pnpm install
```

> 注意：锁文件（bun.lock、package-lock.json 等）未被 Git 跟踪，因为它们可以通过包管理器重新生成。安装依赖后，包管理器会自动生成相应的锁文件。

### 3. 启动开发服务器

```bash
bun run dev
```

或使用 npm：
```bash
npm run dev
```

开发服务器将在 http://localhost:3000 启动。

## 可用的包管理器

项目支持多种包管理器，你可以选择任一个：

| 包管理器 | 命令 | 锁文件 |
|---------|------|--------|
| Bun | `bun install` | bun.lock |
| npm | `npm install` | package-lock.json |
| pnpm | `pnpm install` | pnpm-lock.yaml |
| Yarn | `yarn install` | yarn.lock |

## 常见任务

### 构建项目
```bash
bun run build
```

### 运行测试
```bash
bun run test
```

### 代码检查
```bash
bun run lint
```

### 类型检查
```bash
bun run type-check
```

## 项目结构

```
VimlyPond-GLM/
├── src/                  # 源代码
│   ├── app/              # Next.js App Router
│   ├── components/       # React 组件
│   └── lib/              # 核心库
├── public/               # 静态资源
├── package.json          # 依赖定义
├── next.config.ts        # Next.js 配置
├── tsconfig.json         # TypeScript 配置
└── ...                   # 其他配置文件
```

## 环境变量

如需配置环境变量，请创建 `.env.local` 文件：

```bash
cp .env.example .env.local
```

然后编辑 `.env.local` 填写必要的配置。

## 故障排除

### 依赖安装问题

如果依赖安装失败，尝试：
1. 清除缓存：`bun clean` 或 `rm -rf node_modules`
2. 重新安装：`bun install`

### 端口占用

默认端口为 3000，如果被占用：
- 修改 `package.json` 中的 `dev` 脚本，添加 `-p <port>` 参数
- 或设置 `PORT` 环境变量

### 构建错误

确保 Node.js 版本 >= 18，Bun 版本 >= 1.0。

## 重新生成锁文件

如果锁文件损坏或需要更新：

```bash
# 删除现有锁文件
rm -f bun.lock package-lock.json pnpm-lock.yaml yarn.lock

# 重新安装依赖生成新锁文件
bun install
```

## 贡献指南

请参阅 [开发规范.md](./开发规范.md) 了解代码规范和贡献流程。

## 相关文档

- [README.md](./README.md) - 项目介绍
- [开发规范.md](./开发规范.md) - 开发规范
- [CHANGELOG.md](./CHANGELOG.md) - 版本历史
