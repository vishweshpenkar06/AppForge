import { randomBytes } from 'crypto'

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Excludes ambiguous: 0/O, 1/I/L

function secureRandomChar(): string {
  const bytes = randomBytes(1)
  const idx = bytes[0] % CHARS.length
  return CHARS[idx] ?? 'A'
}

export function createTeamCode(): string {
  let code = 'TEAM-'
  for (let i = 0; i < 8; i++) code += secureRandomChar()
  return code
}
