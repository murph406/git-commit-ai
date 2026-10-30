import { execFileSync } from 'node:child_process'

export const MAX_CHARS = Number(process.env.DIFF_CHARACTER_LIMIT || 10_0000)

const getFileDiff = ({ path, oldPath }: { path: string; oldPath?: string }) => {
  const paths = oldPath ? [oldPath, path] : [path]
  const diff = execFileSync('git', ['diff', '--staged', '--', ...paths], {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
  })

  if (diff.length > MAX_CHARS) return { path, diff: diff.slice(0, MAX_CHARS), truncated: true }
  return { path, diff, truncated: false }
}

export default getFileDiff 