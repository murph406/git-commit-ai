import { execFileSync } from 'node:child_process'

export function getApiKey(): string {
    return execFileSync(
        'security',
        ['find-generic-password', '-s', 'ollama-proxy', '-w'],
        { encoding: 'utf8' },
    ).trim()
}