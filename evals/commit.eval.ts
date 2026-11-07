import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { Eval } from 'braintrust'
import { createModel, FileDiff, generateMessage, getApiKey } from '../src/llm'
import { MAX_CHARS } from '@/tools/getFileDiff'
import length from './scorers/length'
import { Meta, Output } from './scorers/types'
import imperative from './scorers/imperative'
import capitalized from './scorers/capitalized'
import noPeriod from './scorers/noPeriod'

const DIR = 'evals/cases'
const model = createModel(getApiKey())

function splitDiff(diff: string): FileDiff[] {
  return diff
    .split(/^(?=diff --git )/m)
    .filter((part) => part.trim() !== '')
    .map((part) => {
      const match = part.match(/^diff --git a\/.+ b\/(.+)$/m)
      const truncated = part.length > MAX_CHARS

      return {
        path: match ? match[1] : 'unknown file',
        diff: truncated ? part.slice(0, MAX_CHARS) : part,
        truncated
      }
    })
}

Eval('git-commit-ai', {
  experimentName: process.env.EXP,
  data: () =>
    readdirSync(DIR)
      .filter((file) => file.endsWith('.diff'))
      .map((file) => {
        const name = file.replace(/\.diff$/, '')
        const [number, ...rest] = name.split('-')
        const label = rest.join('-')
        const input = readFileSync(`${DIR}/${file}`, 'utf8')
        const expectedPath = `${DIR}/${name}.expected`

        return {
          input,
          expected: existsSync(expectedPath) ? readFileSync(expectedPath, 'utf8').trim() : undefined,
          metadata: { name, number, label, fileCount: splitDiff(input).length } satisfies Meta,
          tags: [label],
        }
      }),
  task: async (diff: string): Promise<Output> => {
    const result = await generateMessage(model, splitDiff(diff))
    return { ...result, message: result.message.trim() }
  },
  scores: [
    length,
    imperative, 
    capitalized, 
    noPeriod
  ],
  maxConcurrency: 1,
})