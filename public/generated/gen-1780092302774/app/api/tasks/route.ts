import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Route: /tasks
  // Purpose: Generated route handler
  // Request schema: {}
  // Response schema: {
  "type": "object"
}
  return NextResponse.json({ ok: true, route: '/tasks', method: 'GET' })
}

export async function POST(request: Request) {
  // Route: /tasks
  // Purpose: Generated route handler
  // Request schema: {}
  // Response schema: {
  "type": "object"
}
  return NextResponse.json({ ok: true, route: '/tasks', method: 'POST' })
}