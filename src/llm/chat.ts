import { generateText, type LanguageModel } from 'ai'

export type ChatTypes = {
    model: LanguageModel,
    system: string,
    prompt: string,
}

export async function chat({ model, system, prompt }: ChatTypes): Promise<string> {
    const { text } = await generateText({
        model,
        system,
        prompt,
        temperature: 0.2,
        maxRetries: 0,
        abortSignal: AbortSignal.timeout(180_000),
    })

    const content = text.trim()
    if (!content) throw new Error('The model returned an empty message.')
    return content
}
