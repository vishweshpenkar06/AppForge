import { NextResponse } from 'next/server'
export async function GET() {
  return NextResponse.json({ highScore: 0 })
}
export async function POST(req: Request) {
  try {
    const body = await req.json()
    // persist score (stub)
    return NextResponse.json({ ok: true, received: body })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 })
  }
}