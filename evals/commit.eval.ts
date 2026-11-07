import { readdirSync, readFileSync } from 'node:fs'
import { Eval } from 'braintrust'
import { createModel, FileDiff, generateMessage, getApiKey } from '../src/llm'
import { MAX_CHARS } from '@/tools/getFileDiff'

const DIR = 'evals/cases'
const model = createModel(getApiKey())

type Output = { message: string; notes: string[] }

const rule = (name: string, pass: (message: string) => boolean) => ({ output }: { output: Output }) => ({ name, score: pass(output.message) ? 1 : 0 })

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

Eval('git-ai-commit', {
  data: () => readdirSync(DIR)
    .filter((file) => file.endsWith('.diff'))
    .map((file) => ({
      input: readFileSync(`${DIR}/${file}`, 'utf8'),
      expected: readFileSync(`${DIR}/${file.replace(/\.diff$/, '.expected')}`, 'utf8').trim(),
      metadata: { name: file },
    })),
  task: (diff: string) => generateMessage(model, splitDiff(diff)),
  scores: [
    rule('length', (m) => m.length <= 72),
    rule('capitalized', (m) => /^[A-Z]/.test(m)),
    rule('noPeriod', (m) => !m.endsWith('.')),
    rule('imperative', (m) => !/(ed|ing)$/.test(m.split(' ')[0])),
  ],
  maxConcurrency: 1,
})