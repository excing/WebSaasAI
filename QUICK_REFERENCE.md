# AI Chat 积分消耗 - 快速参考

## 🔑 关键信息

### 计费规则
```
1 积分 = 1000 tokens
最小消费 = 1 积分
计算方式 = Math.ceil(totalTokens / 1000)
```

### 页面路由
```
/dashboard/credits          - 我的积分页面
/dashboard/chat             - AI Chat 页面（带积分显示）
/api/credits                - 获取积分信息
/api/credits/transactions   - 获取消费记录
```

### 数据库表
```sql
credit_transaction (新增)
├── id: TEXT PRIMARY KEY
├── userId: TEXT NOT NULL
├── packageId: TEXT NOT NULL
├── amount: INTEGER NOT NULL
├── type: TEXT NOT NULL ('chat' | 'image' | 'other')
├── description: TEXT
├── metadata: TEXT (JSON)
└── createdAt: TIMESTAMP NOT NULL
```

## 📝 常用代码片段

### 检查用户积分
```typescript
import { getUserTotalCredits } from '$lib/server/credits';

const totalCredits = await getUserTotalCredits(userId);
if (totalCredits <= 0) {
  // 积分不足处理
}
```

### 消耗积分
```typescript
import { consumeCreditsFromEvent } from '$lib/server/credits';

const success = await consumeCreditsFromEvent(
  event,
  amount,           // 积分数量
  'chat',           // 类型
  'AI Chat - 1234 tokens',  // 描述
  { totalTokens: 1234, model: 'gpt-5' }  // 元数据
);
```

### 获取消费记录
```typescript
import { getUserCreditTransactionsFromEvent } from '$lib/server/credits';

const transactions = await getUserCreditTransactionsFromEvent(event, 50);
```

## 🎨 UI 组件使用

### 积分余额显示
```svelte
<script>
  import { Coins } from "lucide-svelte";
  import { Badge } from "$lib/components/ui/badge";
  
  let totalCredits = 1000;
</script>

<button>
  <Coins class="h-4 w-4" />
  <span>{totalCredits.toLocaleString()}</span>
  <Badge variant={totalCredits > 100 ? "default" : "secondary"}>
    积分
  </Badge>
</button>
```

### 积分不足提示
```svelte
<script>
  import { Alert, AlertDescription } from "$lib/components/ui/alert";
  import { AlertCircle } from "lucide-svelte";
</script>

{#if totalCredits <= 0}
  <Alert variant="destructive">
    <AlertCircle class="h-4 w-4" />
    <AlertDescription>
      积分不足，请购买积分包后继续使用
    </AlertDescription>
  </Alert>
{/if}
```

## 🔍 调试命令

### 查看消费记录
```sql
SELECT 
  ct.*,
  cp.sourceType,
  cp.credits as packageCredits
FROM credit_transaction ct
JOIN credit_package cp ON ct.packageId = cp.id
WHERE ct.userId = 'user_id'
ORDER BY ct.createdAt DESC
LIMIT 10;
```

### 查看积分包状态
```sql
SELECT 
  id,
  sourceType,
  credits,
  remainingCredits,
  status,
  expiresAt,
  CASE 
    WHEN expiresAt < NOW() THEN 'expired'
    WHEN remainingCredits = 0 THEN 'depleted'
    ELSE 'active'
  END as computed_status
FROM credit_package
WHERE userId = 'user_id'
ORDER BY expiresAt ASC;
```

### 验证积分一致性
```sql
-- 检查消费记录总和是否与积分包匹配
SELECT 
  cp.id,
  cp.credits - cp.remainingCredits as consumed,
  COALESCE(SUM(ct.amount), 0) as recorded,
  (cp.credits - cp.remainingCredits) - COALESCE(SUM(ct.amount), 0) as diff
FROM credit_package cp
LEFT JOIN credit_transaction ct ON ct.packageId = cp.id
GROUP BY cp.id
HAVING diff != 0;
```

## 🧪 测试 API

### 获取积分信息
```bash
curl http://localhost:3000/api/credits \
  -H "Cookie: better-auth.session_token=YOUR_TOKEN"
```

### 获取消费记录
```bash
curl "http://localhost:3000/api/credits/transactions?limit=10" \
  -H "Cookie: better-auth.session_token=YOUR_TOKEN"
```

### 测试 Chat（有积分）
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=YOUR_TOKEN" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

### 测试 Chat（无积分）
```bash
# 应返回 402 状态码
curl -i -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=YOUR_TOKEN" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

## 📊 监控指标

### 关键日志
```bash
# 成功消费
✅ Consumed 15 credits for 15234 tokens (user: user_123)

# 消费失败
Failed to consume credits after chat completion

# 积分不足
Insufficient credits
```

### 性能指标
- 积分查询响应时间: < 100ms
- 消费记录查询响应时间: < 500ms
- 积分扣除操作时间: < 200ms

## 🚨 常见问题

### Q: 积分扣除了但消费记录没有？
A: 检查 `consumeCredits()` 函数中的 `db.insert(creditTransaction)` 是否执行成功

### Q: Token 计算不准确？
A: 检查 AI SDK 的 usage 对象，确认使用正确的属性名（inputTokens/outputTokens）

### Q: 积分余额不更新？
A: 检查前端是否在发送消息后调用 `fetchCredits()`

### Q: 跨积分包消耗不正确？
A: 检查积分包是否按 `expiresAt` 升序排序

## 🔧 配置清单

### 环境变量
```bash
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
BETTER_AUTH_SECRET=...
```

### Polar 产品 Metadata
```json
{
  "credits": 10000,
  "validity_period": 365
}
```

### 模型配置
```typescript
// src/routes/api/chat/+server.ts
const modelName = "gpt-5-chat-latest";
const TOKENS_PER_CREDIT = 1000;
```

## 📈 扩展建议

### 短期优化
- [ ] 添加积分消耗预估（发送前显示预计消耗）
- [ ] 添加积分低于阈值的提醒
- [ ] 优化消费记录分页加载

### 中期优化
- [ ] 添加积分使用统计图表
- [ ] 支持积分转赠功能
- [ ] 添加积分过期提醒邮件

### 长期优化
- [ ] 不同模型使用不同计费率
- [ ] 支持按输入/输出 token 分别计费
- [ ] 添加积分兑换其他权益功能

## 📚 相关文件

```
src/
├── lib/
│   ├── server/
│   │   ├── credits.ts              # 积分核心逻辑
│   │   └── db/schema.ts            # 数据库表定义
│   └── components/
│       ├── dashboard/
│       │   └── Sidebar.svelte      # 导航菜单
│       └── ui/alert/               # Alert 组件
├── routes/
│   ├── api/
│   │   ├── chat/+server.ts         # AI Chat API
│   │   └── credits/
│   │       ├── +server.ts          # 积分查询 API
│   │       └── transactions/+server.ts  # 消费记录 API
│   └── dashboard/
│       ├── chat/+page.svelte       # Chat 页面
│       └── credits/+page.svelte    # 积分页面
└── docs/
    ├── CREDITS_CONSUMPTION_IMPLEMENTATION.md
    ├── TESTING_GUIDE.md
    └── QUICK_REFERENCE.md (本文件)
```

---

**最后更新**: 2026-02-03
**版本**: 1.0.0
