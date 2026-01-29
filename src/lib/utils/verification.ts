/**
 * 验证邮件工具函数
 */

/**
 * 记录验证邮件发送时间到 localStorage
 * @param email 用户邮箱
 */
export function recordVerificationEmailSent(email: string): void {
    const now = Date.now();
    const key = `lastVerificationEmailSent_${email}`;
    localStorage.setItem(key, now.toString());
}

/**
 * 获取距离上次发送验证邮件的剩余等待秒数
 * @param email 用户邮箱
 * @param windowSeconds 等待窗口（默认 90 秒）
 * @returns 剩余等待秒数，0 表示可以发送
 */
export function getRemainingWaitTime(email: string, windowSeconds: number = 90): number {
    const key = `lastVerificationEmailSent_${email}`;
    const lastSentTimeStr = localStorage.getItem(key);

    if (!lastSentTimeStr) {
        return 0;
    }

    const lastSentTime = parseInt(lastSentTimeStr, 10);
    const now = Date.now();
    const elapsed = Math.floor((now - lastSentTime) / 1000);
    const remaining = Math.max(0, windowSeconds - elapsed);

    return remaining;
}
