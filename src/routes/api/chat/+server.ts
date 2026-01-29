import { createOpenAI } from '@ai-sdk/openai';
import { streamText, convertToModelMessages } from 'ai';
import type { RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

// 创建自定义 OpenAI provider，支持自定义 baseURL
const openai = createOpenAI({
    baseURL: env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    apiKey: env.OPENAI_API_KEY,
});

export const POST: RequestHandler = async ({ request }) => {
    const { messages } = await request.json();

    // 将 UI messages（包含 parts）转换为 core messages（包含 content）
    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
        model: openai.chat('nvidia/kimi-k2-thinking'),
        messages: modelMessages,
    });

    return result.toUIMessageStreamResponse();
};
