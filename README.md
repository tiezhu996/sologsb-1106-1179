# 木版年画刻版工序档案

## 项目简介

面向木版年画作坊的纯前端工序档案应用。它把画稿、分版、刻版、修版与套色印制过程串成可追溯的本地记录，便于刻工与印制管事按套色序号协作。

## Docker 一键启动

首次启动先复制环境配置，再构建并启动容器：

```bash
cp .env.example .env && docker compose up -d --build
```

停止服务可执行：

```bash
docker compose down
```

## 技术栈

| 层级 | 方案 |
| --- | --- |
| 界面框架 | Svelte 5（runes 模式） |
| 类型系统 | TypeScript（strict） |
| 构建工具 | Vite 5 |
| 状态管理 | Svelte store |
| 页面路由 | svelte-spa-router 4（history 模式） |
| 本地数据 | IndexedDB + Dexie 4 |
| 容器服务 | Nginx alpine |

## 访问地址

服务启动后访问：

```text
http://localhost:21806
```

## 本地开发方式

```bash
cd frontend
npm install
npm run dev
```

类型与组件检查：

```bash
cd frontend
npm run check
```

## 目录结构

```text
.
├── docker-compose.yml
├── .env.example
├── README.md
└── frontend
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    └── src
        ├── components/common/  # 色块、阶段轨道、空态、序号输入
        ├── hooks/              # 版片顺序与刻工负荷派生逻辑
        ├── pages/              # 五个业务页面
        ├── router/             # SPA 路由映射
        ├── stores/             # 画稿、版片、刻工状态
        ├── types/              # 业务模型与具名联合类型
        └── utils/              # Dexie、序号校验、JSON 导出
```

## 数据存储说明

数据全部写入浏览器 IndexedDB，不依赖后端服务。数据库名为 `gbwoodprint-db`，当前结构版本为 `2`。

- `version(1)` 建立画稿、版片、刻工、印制批次、工序节点五张表及常用查询索引。
- `version(2)` 为各表回填 `schemaRev: 2`，便于后续迁移识别数据结构。
- 首次创建数据库时通过 Dexie 的 `populate` 回调写入四类画稿、完整基础版片、四名刻工、印制批次与多条工序节点。
- 刷新页面不会丢失数据；清除浏览器站点数据会同时清除本地档案。

## 核心功能与路由表

| 路由 | 页面 | 主要能力 |
| --- | --- | --- |
| `/drafts` | 画稿总览 | 按题材与状态筛选，查看版片刻成进度和最近印制批次，内联新建画稿 |
| `/drafts/:id/blocks` | 版片编排台 | 按套色序号排列表格，指派刻工、校验序号、标记刻成并记录崩口 |
| `/blocks/:id/nodes` | 工序节点时间线 | 推进或回退工序节点，登记操作人、时间与耗时 |
| `/batches` | 印制批次登记 | 登记纸张、颜料、印数，并逐版填写套色偏差 |
| `/carvers` | 刻工档与版片分布 | 按专长筛选，查看在刻版片数、节点平均耗时与当班分布 |
| 其它 | 画稿总览 | 已实现 history 路由到画稿总览的回退 |
