import { createOpenAICompatible } from '@ai-sdk/openai-compatible'

const BASE_API_URL = process.env.BASE_API_URL
const AI_MODEL = process.env.AI_MODEL

export function createModel(apiKey: string) {
    if (!BASE_API_URL) throw new Error('BASE_API_URL is not set. Add it to .env')
    if (!AI_MODEL) throw new Error('AI_MODEL is not set. Add it to .env')

    const ollama = createOpenAICompatible({
        name: 'ollama',
        baseURL: BASE_API_URL,
        headers: { 'x-api-key': apiKey },
    })

    return ollama(AI_MODEL)
}