
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { createModel, generateMessage, getApiKey, type FileDiff } from '../src/llm'
import { MAX_CHARS } from '../src/tools/getFileDiff'

const CASES_DIR = 'evals/cases'
const RESULTS_DIR = 'evals/results'

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

function check(message: string) {
  const firstWord = message.split(' ')[0]

  return {
    length: message.length <= 72,
    capitalized: /^[A-Z]/.test(message),
    noPeriod: !message.endsWith('.'),
    imperative: !/(ed|ing)$/.test(firstWord)
  }
}

async function main() {
  const model = createModel(getApiKey())
  const names = readdirSync(CASES_DIR)
    .filter((file) => file.endsWith('.diff'))
    .map((file) => file.replace(/\.diff$/, ''))

  const results = []
  let passed = 0

  for (const name of names) {
    const diff = readFileSync(join(CASES_DIR, `${name}.diff`), 'utf8')
    const expected = readFileSync(join(CASES_DIR, `${name}.expected`), 'utf8').trim()

    const { message, notes } = await generateMessage(model, splitDiff(diff))
    const checks = check(message)
    const allPassed = Object.values(checks).every(Boolean)

    if (allPassed) passed++

    console.log(`\n${name} ${allPassed ? '✓' : '✗'}`)
    console.log(`  expected: ${expected}`)
    console.log(`  got:      ${message}`)

    for (const [rule, ok] of Object.entries(checks)) {
      if (!ok) console.log(`  failed:   ${rule}`)
    }

    results.push({ name, expected, message, notes, checks })
  }

  console.log(`\n${passed}/${names.length} passed format checks`)

  mkdirSync(RESULTS_DIR, { recursive: true })
  const file = join(RESULTS_DIR, `${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
  writeFileSync(file, JSON.stringify(results, null, 2))
  console.log(`saved ${file}`)
}

main().catch((error: Error) => {
  console.error(error.message)
  process.exit(1)
})