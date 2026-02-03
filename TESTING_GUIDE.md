# 快速测试指南

## 前置条件

1. 确保数据库已更新（`credit_transaction` 表已创建）
2. 确保有测试用户账号
3. 确保用户有积分包（通过 Polar 购买或手动添加）

## 测试步骤

### 1. 测试"我的积分"页面

```bash
# 访问积分页面
http://localhost:3000/dashboard/credits
```

**预期结果**：
- ✅ 显示总积分余额
- ✅ 显示积分包列表（如果有）
- ✅ 显示消费记录（如果有）
- ✅ "购买积分"按钮可点击

**检查点**：
- 积分包显示来源类型（订阅/购买）
- 积分包显示状态（活跃/已过期/已用完）
- 积分包显示剩余积分和进度条
- 积分包显示过期时间
- 消费记录显示类型、描述、金额、时间

### 2. 测试 Chat 页面积分显示

```bash
# 访问 Chat 页面
http://localhost:3000/dashboard/chat
```

**预期结果**：
- ✅ 页面顶部显示积分余额
- ✅ 积分余额可点击跳转到积分页面
- ✅ 根据积分数量显示不同颜色的徽章

**检查点**：
- 积分 > 100：绿色徽章
- 积分 1-100：黄色徽章
- 积分 = 0：红色徽章

### 3. 测试积分消耗功能

**场景 A：有积分时发送消息**

1. 确保用户有积分（例如 1000 积分）
2. 在 Chat 页面发送一条消息
3. 等待 AI 回复完成

**预期结果**：
- ✅ 消息成功发送
- ✅ AI 正常回复
- ✅ 积分余额自动减少
- ✅ 控制台显示消耗日志：`✅ Consumed X credits for Y tokens`

**验证方法**：
```bash
# 查看消费记录
curl http://localhost:3000/api/credits/transactions \
  -H "Cookie: your-session-cookie"
```

**预期响应**：
```json
{
  "success": true,
  "data": [
    {
      "id": "tx_...",
      "amount": 15,
      "type": "chat",
      "description": "AI Chat - 15234 tokens",
      "metadata": "{\"promptTokens\":1234,\"completionTokens\":14000,...}",
      "createdAt": "2026-02-03T..."
    }
  ]
}
```

**场景 B：积分不足时发送消息**

1. 将用户积分设为 0（或等待积分用完）
2. 尝试在 Chat 页面发送消息

**预期结果**：
- ✅ 输入框被禁用
- ✅ 发送按钮显示"积分不足"并被禁用
- ✅ 显示红色警告提示
- ✅ 提示中包含"购买积分"按钮

**验证方法**：
- 点击"购买积分"按钮应跳转到 `/pricing`
- 尝试发送消息应无反应

### 4. 测试 API 端点

**测试积分查询 API**：
```bash
curl http://localhost:3000/api/credits \
  -H "Cookie: your-session-cookie"
```

**预期响应**：
```json
{
  "success": true,
  "data": {
    "totalCredits": 1000,
    "packages": [...]
  }
}
```

**测试消费记录 API**：
```bash
curl "http://localhost:3000/api/credits/transactions?limit=10" \
  -H "Cookie: your-session-cookie"
```

**预期响应**：
```json
{
  "success": true,
  "data": [...]
}
```

**测试 Chat API（有积分）**：
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

**预期响应**：流式响应，正常返回 AI 回复

**测试 Chat API（无积分）**：
```bash
# 先将积分设为 0，然后：
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

**预期响应**：
```json
{
  "error": "Insufficient credits",
  "message": "You have no credits available. Please purchase a credit package to continue."
}
```
**状态码**：402

### 5. 测试导航菜单

1. 在 Dashboard 侧边栏查找"My Credits"菜单项
2. 点击"My Credits"

**预期结果**：
- ✅ 菜单项存在且可见
- ✅ 使用 Coins 图标
- ✅ 点击后跳转到 `/dashboard/credits`
- ✅ 当前页面时高亮显示

### 6. 测试跨积分包消耗

**前置条件**：
- 用户有多个积分包
- 积分包有不同的过期时间

**测试步骤**：
1. 查看当前积分包列表和过期时间
2. 发送消息消耗积分
3. 查看消费记录中的 `packageId`
4. 验证是否优先从最快过期的积分包扣除

**验证方法**：
```sql
-- 查询用户的积分包（按过期时间排序）
SELECT id, remainingCredits, expiresAt, status
FROM credit_package
WHERE userId = 'user_id'
ORDER BY expiresAt ASC;

-- 查询最近的消费记录
SELECT * FROM credit_transaction
WHERE userId = 'user_id'
ORDER BY createdAt DESC
LIMIT 5;
```

### 7. 测试响应式设计

**测试不同屏幕尺寸**：
1. 桌面端（> 1024px）
2. 平板端（768px - 1024px）
3. 移动端（< 768px）

**预期结果**：
- ✅ 积分包列表在移动端显示为单列
- ✅ 积分包列表在桌面端显示为双列
- ✅ 所有按钮和文字可读
- ✅ 导航菜单在移动端正常工作

## 常见问题排查

### 问题 1：积分余额不更新

**可能原因**：
- 前端缓存未刷新
- API 请求失败

**解决方法**：
```javascript
// 在浏览器控制台检查
fetch('/api/credits').then(r => r.json()).then(console.log)
```

### 问题 2：消费记录为空

**可能原因**：
- 还没有发送过消息
- 数据库表未创建

**解决方法**：
```bash
# 检查数据库表是否存在
npx drizzle-kit studio
# 查看 credit_transaction 表
```

### 问题 3：发送消息后积分未扣除

**可能原因**：
- `onFinish` 回调未触发
- 积分消耗函数失败

**解决方法**：
```bash
# 查看服务端日志
# 应该看到：
# ✅ Consumed X credits for Y tokens (user: user_id)
```

### 问题 4：Token 计算不准确

**可能原因**：
- AI SDK 版本问题
- usage 对象结构变化

**解决方法**：
```javascript
// 在 onFinish 回调中添加日志
console.log('Usage:', JSON.stringify(usage, null, 2));
```

## 性能测试

### 测试并发消费

```bash
# 使用 Apache Bench 测试
ab -n 100 -c 10 -H "Cookie: your-session-cookie" \
  -p message.json -T application/json \
  http://localhost:3000/api/chat
```

**预期结果**：
- ✅ 所有请求正确处理
- ✅ 积分扣除准确
- ✅ 无重复扣除
- ✅ 无数据库死锁

### 测试大量消费记录

```bash
# 创建 1000 条消费记录后
curl "http://localhost:3000/api/credits/transactions?limit=50"
```

**预期结果**：
- ✅ 响应时间 < 500ms
- ✅ 正确返回最近 50 条记录
- ✅ 按时间倒序排列

## 数据验证

### 验证积分包状态

```sql
-- 检查积分包状态是否正确
SELECT
  id,
  remainingCredits,
  status,
  CASE
    WHEN remainingCredits = 0 THEN 'depleted'
    WHEN expiresAt < NOW() THEN 'expired'
    ELSE 'active'
  END as expected_status
FROM credit_package
WHERE status != expected_status;
```

**预期结果**：无记录（所有状态都正确）

### 验证消费记录完整性

```sql
-- 检查消费记录是否与积分包匹配
SELECT
  cp.id,
  cp.credits - cp.remainingCredits as consumed,
  COALESCE(SUM(ct.amount), 0) as recorded
FROM credit_package cp
LEFT JOIN credit_transaction ct ON ct.packageId = cp.id
GROUP BY cp.id
HAVING consumed != recorded;
```

**预期结果**：无记录（消费记录与积分包一致）

## 测试清单

- [ ] "我的积分"页面正常显示
- [ ] Chat 页面顶部显示积分余额
- [ ] 有积分时可以正常发送消息
- [ ] 积分不足时正确阻止发送
- [ ] 消息发送后积分正确扣除
- [ ] 消费记录正确记录
- [ ] Token 计算准确
- [ ] 跨积分包消耗正确
- [ ] 导航菜单正常工作
- [ ] 响应式设计正常
- [ ] API 端点正常响应
- [ ] 错误提示友好清晰
- [ ] 购买积分按钮正常跳转

## 下一步

测试完成后，可以：
1. 提交代码到 Git
2. 部署到测试环境
3. 进行用户验收测试
4. 收集用户反馈
5. 优化和改进
