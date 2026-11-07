export type Output = { message: string; notes: string[] }
export type Meta = { name: string; number: string; label: string; fileCount: number }
export type Args = { input: string; output: Output; expected?: string; metadata?: Meta }
export type Score = { name: string; score: number | null; metadata?: Record<string, unknown> }