import { COMMIT_PROMPT, NOTE_PROMPT } from '@/prompts'
import { LanguageModel } from 'ai'
import { chat } from './chat'

export type FileDiff = {
    path: string
    diff: string
    truncated: boolean
}

export async function generateMessage(model: LanguageModel, files: FileDiff[]) {
    const notes: string[] = []

    for (const file of files) {
        const prompt = file.truncated
            ? `${file.diff}\n\n[Diff cut off: the rest of this file's changes are not shown]`
            : file.diff

        const note = await chat({ model, system: NOTE_PROMPT, prompt })
        notes.push(`${file.path}: ${note}`)
    }

    const raw = await chat({ model, system: COMMIT_PROMPT, prompt: notes.join('\n') })
    const message = raw.split('\n')[0].trim().replace(/\.$/, '')

    return { message, notes }
}

export * from './apiKey'
export * from './chat'
export * from './model'