import { createOpenAI } from '@ai-sdk/openai';
import { streamText, convertToModelMessages } from 'ai';
import type { RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { getUserTotalCredits, consumeCreditsFromEvent } from '$lib/server/credits';

// 创建自定义 OpenAI provider，支持自定义 baseURL
const openai = createOpenAI({
    baseURL: env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    apiKey: env.OPENAI_API_KEY,
});

// Token to credit conversion rate (1 credit = 1000 tokens)
const TOKENS_PER_CREDIT = 1000;

export const POST: RequestHandler = async (event) => {
    const { request } = event;
    const session = event.locals.session;

    // Check authentication
    if (!session?.user?.id) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has any credits
    const totalCredits = await getUserTotalCredits(session.user.id);
    if (totalCredits <= 0) {
        return json(
            {
                error: 'Insufficient credits',
                message: 'You have no credits available. Please purchase a credit package to continue.'
            },
            { status: 402 }
        );
    }

    const { messages } = await request.json();

    // 将 UI messages（包含 parts）转换为 core messages（包含 content）
    const modelMessages = await convertToModelMessages(messages);
    const modelName = "gpt-5-chat-latest";

    const result = streamText({
        model: openai.chat(modelName),
        messages: modelMessages,
        onFinish: async ({ usage }) => {
            // Calculate credits to consume based on token usage
            // AI SDK v6 uses different property names
            const promptTokens = (usage as any).inputTokens || 0;
            const completionTokens = (usage as any).outputTokens || 0;
            const totalTokens = promptTokens + completionTokens;
            const creditsToConsume = Math.ceil(totalTokens / TOKENS_PER_CREDIT);

            console.log(
                `AI chat finish: ${JSON.stringify(usage)}`
            );

            // Consume credits and record transaction
            const success = await consumeCreditsFromEvent(
                event,
                creditsToConsume,
                'chat',
                `AI Chat - ${totalTokens} tokens`,
                {
                    promptTokens,
                    completionTokens,
                    totalTokens,
                    model: modelName
                }
            );

            if (!success) {
                console.error('Failed to consume credits after chat completion');
            } else {
                console.log(
                    `✅ Consumed ${creditsToConsume} credits for ${totalTokens} tokens (user: ${session.user.id})`
                );
            }
        }
    });

    return result.toUIMessageStreamResponse();
};
