# AI Chat 积分消耗功能实现文档

## 概述

本次更新为 AI Chat 添加了完整的积分消耗逻辑，并创建了"我的积分"页面，用户可以查看积分余额、积分包详情和消费记录。

## 实现的功能

### 1. 数据库层

#### 新增表：`credit_transaction`
用于记录所有积分消费历史。

**字段说明**：
- `id`: 交易 ID（主键）
- `userId`: 用户 ID（外键）
- `packageId`: 积分包 ID（外键）
- `amount`: 消耗的积分数量
- `type`: 消费类型（'chat' | 'image' | 'other'）
- `description`: 描述信息（例如："AI Chat - 1234 tokens"）
- `metadata`: JSON 元数据（存储 token 数量、模型等详细信息）
- `createdAt`: 创建时间

**迁移文件**: 已通过 `drizzle-kit push` 推送到数据库

### 2. 后端 API 层

#### 修改：`src/lib/server/credits.ts`

**新增功能**：
1. `CreditTransaction` 接口定义
2. `consumeCredits()` 函数增强：
   - 新增参数：`type`, `description`, `metadata`
   - 自动记录每次消费到 `credit_transaction` 表
3. `getUserCreditTransactions()`: 获取用户消费记录
4. `getUserCreditTransactionsFromEvent()`: 从 RequestEvent 获取消费记录

#### 修改：`src/routes/api/chat/+server.ts`

**积分消耗逻辑**：
1. **请求前检查**：
   - 验证用户身份
   - 检查用户是否有积分（`totalCredits > 0`）
   - 如果积分不足，返回 402 错误

2. **按 Token 计费**：
   - 转换率：1 积分 = 1000 tokens
   - 使用 AI SDK 的 `onFinish` 回调获取实际 token 使用量
   - 计算公式：`creditsToConsume = Math.ceil(totalTokens / 1000)`

3. **消费记录**：
   - 记录 `promptTokens` 和 `completionTokens`
   - 记录使用的模型名称
   - 记录总 token 数量

#### 新增：`src/routes/api/credits/transactions/+server.ts`

**功能**：获取用户的积分消费记录

**端点**：`GET /api/credits/transactions?limit=50`

**响应示例**：
```json
{
  "success": true,
  "data": [
    {
      "id": "tx_1234567890_abc123",
      "userId": "user_123",
      "packageId": "cp_sub_abc123_1234567890",
      "amount": 15,
      "type": "chat",
      "description": "AI Chat - 15234 tokens",
      "metadata": "{\"promptTokens\":1234,\"completionTokens\":14000,\"totalTokens\":15234,\"model\":\"nvidia/kimi-k2-thinking\"}",
      "createdAt": "2026-02-03T12:34:56.789Z"
    }
  ]
}
```

### 3. 前端页面

#### 新增：`src/routes/dashboard/credits/+page.svelte`

**"我的积分"页面功能**：

1. **总积分展示卡片**：
   - 显示当前总积分余额
   - 预估可进行的对话次数（按每次 10 积分计算）
   - 渐变背景设计

2. **积分包列表**：
   - 显示所有积分包（订阅和购买）
   - 每个积分包显示：
     - 来源类型（订阅/购买）
     - 状态（活跃/已过期/已用完）
     - 剩余积分 / 总积分
     - 进度条可视化
     - 过期时间（智能显示：今天过期、X天后过期、具体日期）
   - 响应式网格布局（1-2列）

3. **消费记录列表**：
   - 显示最近 20 条消费记录
   - 每条记录显示：
     - 消费类型（AI 对话/图片处理/其他）
     - 描述信息
     - Token 数量和模型（从 metadata 解析）
     - 消耗的积分数量
     - 消费时间
   - 按时间倒序排列

4. **充值入口**：
   - 顶部"购买积分"按钮
   - 跳转到 `/pricing` 页面

#### 修改：`src/routes/dashboard/chat/+page.svelte`

**AI Chat 页面增强**：

1. **顶部积分显示**：
   - 固定在页面顶部的积分余额栏
   - 显示当前积分数量
   - 根据积分数量显示不同颜色的徽章：
     - 绿色（> 100 积分）
     - 黄色（1-100 积分）
     - 红色（0 积分）
   - 点击可跳转到"我的积分"页面

2. **积分不足提示**：
   - 当积分为 0 时显示警告提示
   - 提供"购买积分"快捷按钮
   - 禁用输入框和发送按钮

3. **发送按钮状态**：
   - 积分不足时显示"积分不足"
   - 禁用状态下无法发送消息

4. **错误处理**：
   - 捕获 402 错误（积分不足）
   - 显示友好的错误提示
   - 自动刷新积分余额

5. **自动刷新积分**：
   - 页面加载时获取积分
   - 发送消息后自动刷新积分

#### 修改：`src/lib/components/dashboard/Sidebar.svelte`

**导航菜单更新**：
- 在 "Chat" 和 "Upload" 之间添加 "My Credits" 菜单项
- 使用 `Coins` 图标

### 4. UI 组件

**新增组件**：
- `Alert` 和 `AlertDescription`（通过 shadcn-svelte 安装）

**使用的图标**：
- `Coins`: 积分图标
- `Package`: 积分包图标
- `Clock`: 时间图标
- `TrendingUp`: 趋势图标
- `ShoppingCart`: 购物车图标
- `AlertCircle`: 警告图标

## 技术细节

### Token 计费逻辑

```typescript
// 转换率：1 积分 = 1000 tokens
const TOKENS_PER_CREDIT = 1000;

// 在 AI 响应完成后计算
onFinish: async ({ usage }) => {
    const promptTokens = (usage as any).promptTokens || 0;
    const completionTokens = (usage as any).completionTokens || 0;
    const totalTokens = promptTokens + completionTokens;
    const creditsToConsume = Math.ceil(totalTokens / TOKENS_PER_CREDIT);

    // 消耗积分并记录
    await consumeCreditsFromEvent(event, creditsToConsume, 'chat', ...);
}
```

### 积分消耗优先级

系统自动按照过期时间排序，优先消耗最快过期的积分包：

1. 获取所有活跃的积分包（按 `expiresAt` 升序）
2. 从最快过期的积分包开始扣除
3. 如果一个积分包不足，继续从下一个扣除
4. 记录每次扣除的交易记录

### 错误处理

**前端**：
- 积分不足时禁用发送功能
- 显示友好的错误提示
- 提供购买积分的快捷入口

**后端**：
- 请求前验证积分余额
- 返回明确的错误状态码（402 Payment Required）
- 记录消费失败日志

## 文件变更清单

### 新增文件
1. `src/lib/server/db/schema.ts` - 新增 `creditTransaction` 表定义
2. `src/routes/api/credits/transactions/+server.ts` - 消费记录 API
3. `src/routes/dashboard/credits/+page.svelte` - 我的积分页面
4. `src/lib/components/ui/alert/` - Alert 组件（shadcn-svelte）

### 修改文件
1. `src/lib/server/credits.ts` - 增强积分消耗功能，添加交易记录
2. `src/routes/api/chat/+server.ts` - 集成积分消耗逻辑
3. `src/routes/dashboard/chat/+page.svelte` - 添加积分显示和不足提示
4. `src/lib/components/dashboard/Sidebar.svelte` - 添加"我的积分"菜单项

## 使用说明

### 用户流程

1. **查看积分**：
   - 访问 `/dashboard/credits` 查看详细积分信息
   - 在 Chat 页面顶部查看当前余额

2. **使用 AI Chat**：
   - 发送消息时自动检查积分
   - 消息发送后自动扣除积分
   - 积分不足时无法发送

3. **购买积分**：
   - 点击"购买积分"按钮跳转到 `/pricing`
   - 购买后积分包自动创建（通过 Polar webhook）

4. **查看消费记录**：
   - 在"我的积分"页面查看详细消费历史
   - 包含 token 数量、模型等详细信息

### 管理员配置

在 Polar Dashboard 中配置产品时，在 Metadata 中添加：

```json
{
  "credits": 10000,
  "validity_period": 365
}
```

- `credits`: 积分数量
- `validity_period`: 有效期（天数，可选）

## 测试建议

1. **积分消耗测试**：
   - 发送不同长度的消息
   - 验证 token 计算是否准确
   - 检查消费记录是否正确

2. **积分不足测试**：
   - 将积分余额设为 0
   - 验证是否正确阻止发送
   - 检查错误提示是否显示

3. **跨积分包消耗测试**：
   - 创建多个积分包
   - 验证是否优先消耗快过期的
   - 检查跨包扣除是否正确

4. **UI 测试**：
   - 测试响应式布局
   - 验证积分余额实时更新
   - 检查导航和跳转

## 注意事项

1. **Token 计费精度**：
   - 使用 `Math.ceil()` 向上取整，确保不会出现小数积分
   - 最小消费 1 积分（即使只用了 1 个 token）

2. **AI SDK 兼容性**：
   - 使用 `(usage as any)` 类型断言处理 AI SDK v6 的类型问题
   - 未来 SDK 更新可能需要调整

3. **性能考虑**：
   - 消费记录查询限制为 50 条（可通过 `limit` 参数调整）
   - 积分余额在前端缓存，发送消息后刷新

4. **安全性**：
   - 所有积分操作都在服务端验证
   - 前端禁用只是 UX 优化，不依赖前端验证

## 未来扩展建议

1. **积分统计图表**：
   - 使用 layerchart 显示每日消费趋势
   - 显示不同类型消费的占比

2. **积分预警**：
   - 积分低于阈值时发送邮件提醒
   - 积分即将过期时提醒用户

3. **批量操作**：
   - 支持批量查询消费记录
   - 导出消费记录为 CSV

4. **积分转赠**：
   - 允许用户之间转赠积分
   - 需要额外的权限和审计机制

5. **更精细的计费**：
   - 不同模型使用不同的计费率
   - 支持按输入/输出 token 分别计费

## 相关文档

- [积分系统基础文档](./CREDITS_SYSTEM.md)
- [Polar 集成文档](https://docs.polar.sh/)
- [AI SDK 文档](https://sdk.vercel.ai/docs)
