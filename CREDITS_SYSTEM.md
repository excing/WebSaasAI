# 积分系统实现文档

## 概述

本项目已实现完整的积分系统，支持从 Polar 订阅和一次性购买中获取积分，并实现了优先消耗快过期积分的逻辑。

## 功能特性

### 1. 积分来源
- **订阅（Subscription）**：用户订阅产品时，从 metadata 中的 `credits` 字段获取积分
- **一次性购买（Order）**：用户购买资源包时，从 metadata 中的 `credits` 字段获取积分
- 一个用户可以同时拥有多个积分包（订阅 + 多个资源包）

### 2. 积分有效期
- 支持从 metadata 中的 `validity_period` 字段设置有效期（单位：天）
- 订阅积分：如果没有 `validity_period`，则使用订阅的 `currentPeriodEnd` 作为过期时间
- 一次性购买积分：如果没有 `validity_period`，默认有效期为 1 年

### 3. 积分消耗策略
- **优先消耗快过期的积分**：系统自动按过期时间排序，优先使用即将过期的积分
- 支持跨多个积分包消耗
- 自动更新积分包状态（active → depleted 或 expired）

## 数据库结构

### credit_package 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | text | 主键，格式：`cp_sub_{subscriptionId}_{timestamp}` 或 `cp_ord_{orderId}_{timestamp}` |
| userId | text | 用户 ID（外键） |
| sourceType | text | 来源类型：'subscription' 或 'order' |
| sourceId | text | 来源 ID（subscription.id 或 order.id） |
| credits | integer | 初始积分额度 |
| remainingCredits | integer | 剩余积分额度 |
| validityPeriod | integer | 有效期（天数，可选） |
| expiresAt | timestamp | 过期时间 |
| status | text | 状态：'active'（活跃）、'expired'（已过期）、'depleted'（已用完） |
| createdAt | timestamp | 创建时间 |
| updatedAt | timestamp | 更新时间 |

## Webhook 处理

### Subscription Webhook
当收到订阅相关的 webhook 事件时（`subscription.created`、`subscription.updated` 等）：

1. 保存订阅信息到 `subscription` 表
2. 检查 `metadata` 中是否有 `credits` 字段
3. 如果有，创建或更新对应的积分包记录

**Metadata 格式示例**：
```json
{
  "credits": 1000,
  "validity_period": 30
}
```

### Order Webhook
当收到订单相关的 webhook 事件时（`order.created`、`order.paid`、`order.updated`）：

1. 保存订单信息到 `order` 表
2. **仅当订单已支付**（`paid: true`）时，检查 `metadata` 中是否有 `credits` 字段
3. 如果有，创建或更新对应的积分包记录

**Metadata 格式示例**：
```json
{
  "credits": 500,
  "validity_period": 90
}
```

## API 端点

### GET /api/credits
获取用户的积分信息

**响应示例**：
```json
{
  "success": true,
  "data": {
    "totalCredits": 1500,
    "packages": [
      {
        "id": "cp_sub_abc123_1234567890",
        "userId": "user_123",
        "sourceType": "subscription",
        "sourceId": "sub_abc123",
        "credits": 1000,
        "remainingCredits": 800,
        "validityPeriod": 30,
        "expiresAt": "2026-03-05T00:00:00.000Z",
        "status": "active",
        "createdAt": "2026-02-03T00:00:00.000Z",
        "updatedAt": "2026-02-03T00:00:00.000Z"
      },
      {
        "id": "cp_ord_xyz789_1234567891",
        "userId": "user_123",
        "sourceType": "order",
        "sourceId": "ord_xyz789",
        "credits": 500,
        "remainingCredits": 500,
        "validityPeriod": 90,
        "expiresAt": "2026-05-04T00:00:00.000Z",
        "status": "active",
        "createdAt": "2026-02-03T00:00:00.000Z",
        "updatedAt": "2026-02-03T00:00:00.000Z"
      }
    ]
  }
}
```

### POST /api/credits
消耗用户的积分

**请求体**：
```json
{
  "amount": 100
}
```

**响应示例**：
```json
{
  "success": true,
  "message": "Successfully consumed 100 credits",
  "data": {
    "totalCredits": 1400,
    "packages": [...]
  }
}
```

**错误响应**：
```json
{
  "error": "Insufficient credits",
  "details": "Not enough credits available"
}
```

## 辅助函数（src/lib/server/credits.ts）

### 核心函数

#### `getUserCreditPackages(userId: string): Promise<CreditPackage[]>`
获取用户所有活跃的积分包，按过期时间排序（最早过期的在前）

#### `getUserTotalCredits(userId: string): Promise<number>`
获取用户的总积分数

#### `getUserCreditSummary(userId: string): Promise<CreditSummary>`
获取用户的积分摘要（总积分 + 积分包详情）

#### `consumeCredits(userId: string, amount: number): Promise<boolean>`
消耗用户的积分
- 优先从最快过期的积分包中扣除
- 如果积分不足，返回 `false`
- 成功消耗返回 `true`

#### `updateExpiredPackages(): Promise<number>`
更新已过期的积分包状态
- 将过期的积分包状态从 `active` 改为 `expired`
- 返回更新的记录数

### 便捷函数（用于 SvelteKit RequestEvent）

#### `getUserCreditsFromEvent(event: RequestEvent): Promise<CreditSummary | null>`
从 RequestEvent 中获取当前用户的积分信息

#### `consumeCreditsFromEvent(event: RequestEvent, amount: number): Promise<boolean>`
从 RequestEvent 中消耗当前用户的积分

## 使用示例

### 在 API 路由中使用

```typescript
import { consumeCreditsFromEvent, getUserCreditsFromEvent } from '$lib/server/credits';
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async (event) => {
    // 检查用户积分
    const creditSummary = await getUserCreditsFromEvent(event);

    if (!creditSummary || creditSummary.totalCredits < 10) {
        return json({ error: 'Insufficient credits' }, { status: 400 });
    }

    // 执行某些操作...

    // 消耗积分
    const success = await consumeCreditsFromEvent(event, 10);

    if (!success) {
        return json({ error: 'Failed to consume credits' }, { status: 500 });
    }

    return json({ success: true });
};
```

### 在服务端逻辑中使用

```typescript
import { consumeCredits, getUserTotalCredits } from '$lib/server/credits';

async function processUserRequest(userId: string) {
    // 检查积分
    const totalCredits = await getUserTotalCredits(userId);

    if (totalCredits < 5) {
        throw new Error('Insufficient credits');
    }

    // 执行操作...

    // 消耗积分
    await consumeCredits(userId, 5);
}
```

## 积分消耗逻辑示例

假设用户有以下积分包：

| 积分包 | 类型 | 剩余积分 | 过期时间 |
|--------|------|----------|----------|
| Package A | 订阅 | 500 | 2026-02-10 |
| Package B | 资源包 | 300 | 2026-02-15 |
| Package C | 资源包 | 200 | 2026-03-01 |

当用户消耗 600 积分时：
1. 先从 Package A 扣除 500（最快过期）
2. 再从 Package B 扣除 100
3. 最终状态：
   - Package A: 0（状态变为 depleted）
   - Package B: 200
   - Package C: 200

## 在 Polar 中配置产品

### 订阅产品
在 Polar Dashboard 创建订阅产品时，在 Metadata 中添加：
```json
{
  "credits": 1000,
  "validity_period": 30
}
```

### 一次性产品（资源包）
在 Polar Dashboard 创建一次性产品时，在 Metadata 中添加：
```json
{
  "credits": 500,
  "validity_period": 90
}
```

## 注意事项

1. **Webhook 处理**：积分包的创建是在 webhook 处理时自动完成的，无需手动干预
2. **过期检查**：在获取积分或消耗积分前，系统会自动调用 `updateExpiredPackages()` 更新过期状态
3. **订阅续费**：当订阅续费时，webhook 会更新积分包的过期时间和积分额度
4. **订单支付**：只有已支付的订单才会创建积分包
5. **积分包唯一性**：每个订阅或订单只会创建一个积分包，重复的 webhook 会更新现有记录

## 数据库迁移

积分系统的数据库表已通过 `drizzle-kit push` 推送到数据库。

如果需要重新生成迁移文件：
```bash
npx drizzle-kit generate
```

如果需要直接推送 schema 变更（开发环境）：
```bash
npx drizzle-kit push
```

## 类型定义

所有类型定义都在 `src/lib/server/credits.ts` 中：

```typescript
export interface CreditPackage {
    id: string;
    userId: string;
    sourceType: 'subscription' | 'order';
    sourceId: string;
    credits: number;
    remainingCredits: number;
    validityPeriod: number | null;
    expiresAt: Date;
    status: 'active' | 'expired' | 'depleted';
    createdAt: Date;
    updatedAt: Date;
}

export interface CreditSummary {
    totalCredits: number;
    packages: CreditPackage[];
}
```

## 测试建议

1. **测试订阅积分**：
   - 在 Polar Sandbox 中创建订阅产品，添加 metadata
   - 完成订阅购买
   - 调用 `GET /api/credits` 查看积分

2. **测试资源包积分**：
   - 在 Polar Sandbox 中创建一次性产品，添加 metadata
   - 完成购买
   - 调用 `GET /api/credits` 查看积分

3. **测试积分消耗**：
   - 调用 `POST /api/credits` 消耗积分
   - 验证优先消耗快过期的积分

4. **测试过期逻辑**：
   - 手动修改数据库中的 `expiresAt` 为过去的时间
   - 调用 `GET /api/credits` 触发过期检查
   - 验证积分包状态变为 `expired`

## 未来扩展建议

1. **积分历史记录**：创建 `credit_transaction` 表记录所有积分变动
2. **积分提醒**：在积分即将过期时发送邮件提醒
3. **积分统计**：在 Dashboard 中显示积分使用统计图表
4. **积分转赠**：允许用户之间转赠积分
5. **积分兑换**：支持积分兑换其他权益
