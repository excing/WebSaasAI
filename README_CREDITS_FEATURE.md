# AI Chat 积分消耗功能 - 快速指南

## 🎯 功能概述

为 AI Chat 添加了完整的积分消耗系统，用户每次使用 AI 对话都会根据实际 token 使用量扣除积分。

## ✨ 核心功能

### 1. 积分消耗逻辑
- **计费方式**: 按 token 数量计费（1 积分 = 1000 tokens）
- **消耗时机**: AI 回复完成后，根据实际 token 使用量扣除
- **消耗策略**: 优先消耗最快过期的积分包
- **记录详情**: 记录 inputTokens、outputTokens、model 等信息

### 2. "我的积分"页面 (`/dashboard/credits`)
- 总积分余额展示（大卡片，渐变背景）
- 积分包列表（来源、状态、剩余、进度条、过期时间）
- 消费记录列表（类型、描述、token 信息、金额、时间）
- 购买积分入口

### 3. Chat 页面增强
- 顶部显示积分余额（可点击跳转）
- 根据积分数量显示不同颜色徽章
- 积分不足时禁用发送功能
- 友好的错误提示和购买引导
- 发送消息后自动刷新积分

## 📊 技术实现

### 数据库
```sql
-- 新增表：credit_transaction
CREATE TABLE credit_transaction (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  packageId TEXT NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,  -- 'chat' | 'image' | 'other'
  description TEXT,
  metadata TEXT,  -- JSON: {promptTokens, completionTokens, totalTokens, model}
  createdAt TIMESTAMP NOT NULL
);
```

### API 端点
- `GET /api/credits` - 获取用户积分信息
- `GET /api/credits/transactions?limit=50` - 获取消费记录
- `POST /api/chat` - AI 对话（集成积分检查和消耗）

### 计费逻辑
```typescript
// 1 积分 = 1000 tokens
const TOKENS_PER_CREDIT = 1000;

onFinish: async ({ usage }) => {
  const totalTokens = inputTokens + outputTokens;
  const creditsToConsume = Math.ceil(totalTokens / 1000);
  
  await consumeCreditsFromEvent(event, creditsToConsume, 'chat', ...);
}
```

## 🚀 快速测试

### 1. 查看积分页面
```bash
# 访问
http://localhost:3000/dashboard/credits
```

### 2. 测试 Chat 功能
```bash
# 访问
http://localhost:3000/dashboard/chat

# 发送消息，观察：
# - 顶部积分余额是否减少
# - 消费记录是否新增
```

### 3. 测试积分不足
```bash
# 将积分设为 0，然后访问 Chat 页面
# 应该看到：
# - 输入框被禁用
# - 发送按钮显示"积分不足"
# - 显示警告提示和购买按钮
```

## 📁 主要文件

### 新增文件
- `src/routes/dashboard/credits/+page.svelte` - 我的积分页面
- `src/routes/api/credits/transactions/+server.ts` - 消费记录 API
- `src/lib/components/ui/alert/*` - Alert 组件

### 修改文件
- `src/lib/server/db/schema.ts` - 新增 creditTransaction 表
- `src/lib/server/credits.ts` - 增强积分消耗功能
- `src/routes/api/chat/+server.ts` - 集成积分消耗
- `src/routes/dashboard/chat/+page.svelte` - 添加积分显示
- `src/lib/components/dashboard/Sidebar.svelte` - 添加菜单项

## 🎨 UI 展示

### 积分余额徽章颜色
- 🟢 绿色：积分 > 100
- 🟡 黄色：积分 1-100
- 🔴 红色：积分 = 0

### 积分包状态
- ✅ 活跃 (active)
- ⏰ 已过期 (expired)
- 📭 已用完 (depleted)

## ⚙️ 配置

### Polar 产品配置
在 Polar Dashboard 创建产品时，在 Metadata 中添加：
```json
{
  "credits": 10000,
  "validity_period": 365
}
```

### 环境变量
确保已配置：
- `DATABASE_URL` - 数据库连接
- `OPENAI_API_KEY` - OpenAI API 密钥
- `BETTER_AUTH_SECRET` - 认证密钥

## 📝 使用流程

1. **用户购买积分包**
   - 通过 Polar 购买订阅或一次性产品
   - Webhook 自动创建积分包

2. **用户使用 AI Chat**
   - 访问 `/dashboard/chat`
   - 发送消息
   - 系统自动检查积分
   - AI 回复后自动扣除积分

3. **查看消费记录**
   - 访问 `/dashboard/credits`
   - 查看详细的消费历史
   - 包含 token 数量、模型等信息

4. **积分不足时**
   - 系统阻止发送消息
   - 显示友好提示
   - 提供购买入口

## 🔍 调试

### 查看消费日志
```bash
# 服务端日志应显示：
✅ Consumed 15 credits for 15234 tokens (user: user_123)
```

### 查看数据库
```sql
-- 查看消费记录
SELECT * FROM credit_transaction 
WHERE userId = 'user_id' 
ORDER BY createdAt DESC 
LIMIT 10;

-- 查看积分包状态
SELECT id, remainingCredits, status, expiresAt 
FROM credit_package 
WHERE userId = 'user_id';
```

## 📚 相关文档

- `CREDITS_CONSUMPTION_IMPLEMENTATION.md` - 详细实现文档
- `TESTING_GUIDE.md` - 完整测试指南
- `CREDITS_SYSTEM.md` - 积分系统基础文档

## ✅ 完成清单

- [x] 数据库表创建
- [x] 后端 API 实现
- [x] 前端页面开发
- [x] UI 组件集成
- [x] 类型检查通过
- [x] 文档编写完成

## 🎉 开始使用

```bash
# 1. 确保数据库已更新
npx drizzle-kit push

# 2. 启动开发服务器
npm run dev

# 3. 访问积分页面
open http://localhost:3000/dashboard/credits

# 4. 测试 Chat 功能
open http://localhost:3000/dashboard/chat
```

---

**注意**: 确保用户有积分包才能使用 AI Chat 功能。可以通过 Polar 购买或手动在数据库中添加测试积分包。
