const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Excludes ambiguous: 0/O, 1/I/L

function randomChar(): string {
  return CHARS[Math.floor(Math.random() * CHARS.length)]
}

export function createTeamCode(): string {
  let code = 'TEAM-'
  for (let i = 0; i < 8; i++) code += randomChar()
  return code
}
