import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Route: /items
  // Purpose: Generated route handler
  // Request schema: {}
  // Response schema: {
  "type": "object"
}
  return NextResponse.json({ ok: true, route: '/items', method: 'GET' })
}

export async function POST(request: Request) {
  // Route: /items
  // Purpose: Generated route handler
  // Request schema: {}
  // Response schema: {
  "type": "object"
}
  return NextResponse.json({ ok: true, route: '/items', method: 'POST' })
}