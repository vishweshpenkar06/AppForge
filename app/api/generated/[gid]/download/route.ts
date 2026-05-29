import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import archiver from 'archiver'
import { PassThrough } from 'stream'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest, { params }: { params: { gid: string } }) {
  const { gid } = params

  // allow dev-only unauthenticated access for convenience
  if (process.env.NODE_ENV === 'production') {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const base = path.join(process.cwd(), 'public', 'generated')
  const target = path.join(base, gid)

  if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const archive = archiver('zip', { zlib: { level: 9 } })
  const pass = new PassThrough()

  archive.on('error', (err) => {
    console.error('Archive error', err)
    pass.emit('error', err)
  })

  // pipe archive data to the PassThrough stream which will be returned as Response body
  archive.directory(target, false)
  archive.finalize()
  archive.pipe(pass)

  const headers = new Headers()
  headers.set('Content-Type', 'application/zip')
  headers.set('Content-Disposition', `attachment; filename="${gid}.zip"`)

  return new Response(pass, { headers })
}

export const runtime = 'nodejs'
