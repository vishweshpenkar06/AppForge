'use client'

import { useState, useRef, useCallback } from 'react'

export interface StageUpdate {
  stage: string
  stageOrder: number
  status: 'active' | 'completed' | 'error'
  latencyMs: number
}

export interface CompileStreamResult {
  success: boolean
  jobId?: string
  config?: any
  runtime?: { sql: string; express: string; react: Record<string, string> }
  docs?: { prd: string; trd: string; appFlow: string; uiUxBrief: string; backendSchema: string; implementationPlan: string }
  implementationPlan?: { summary: string; prismaSchema: string; apiHandlers: { path: string; content: string }[]; uiPages: { path: string; content: string }[]; rbac: Record<string, string[]>; checklist: string[] }
  validation?: { valid: boolean; errors: string[]; warnings: string[]; repairs?: string[]; score: number }
  execution?: { executable: boolean; issues: string[]; readyForDeployment: boolean }
  metrics?: { latency: number; stageTimes: Record<string, number> }
  assumptions?: string[]
  error?: string
}

interface UseCompileStreamReturn {
  stages: StageUpdate[]
  result: CompileStreamResult | null
  loading: boolean
  error: string | null
  compile: (prompt: string, mode: string) => void
  reset: () => void
}

export function useCompileStream(): UseCompileStreamReturn {
  const [stages, setStages] = useState<StageUpdate[]>([])
  const [result, setResult] = useState<CompileStreamResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const fallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const reset = useCallback(() => {
    abortRef.current?.abort()
    if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current)
    setStages([])
    setResult(null)
    setLoading(false)
    setError(null)
  }, [])

  const compile = useCallback((prompt: string, mode: string) => {
    reset()
    setLoading(true)

    const controller = new AbortController()
    abortRef.current = controller

    let fallbackTriggered = false

    const cleanup = () => {
      if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current)
    }

    const fallbackToSync = async () => {
      if (fallbackTriggered) return
      fallbackTriggered = true
      cleanup()

      try {
        const r = await fetch('/api/compile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, mode }),
          signal: controller.signal,
        })
        const d = await r.json()
        if (d.upgradeRequired) {
          setError(d.error)
          setResult(null)
        } else if (d.status === 'needs_clarification') {
          setResult({ success: false, error: `Prompt needs more detail: ${(d.detectedIssues || []).join('; ')}` })
        } else {
          setResult(d)
        }
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') {
          setError(e.message || 'Compilation failed')
        }
      } finally {
        setLoading(false)
      }
    }

    // Use GET-based EventSource via query params in URL
    // EventSource doesn't support POST, so we POST to get a job ID, then stream via GET
    // But our SSE endpoint is POST-only, so we use fetch + ReadableStream parsing
    const runStream = async () => {
      try {
        const response = await fetch('/api/compile-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, mode }),
          signal: controller.signal,
        })

        if (!response.ok || !response.body) {
          // Fallback to non-streaming
          await fallbackToSync()
          return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        // Set a generous fallback timeout — if no events arrive in 8s, assume SSE failed
        fallbackTimeoutRef.current = setTimeout(() => {
          if (!fallbackTriggered) fallbackToSync()
        }, 8000)

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          let eventType = ''
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim()
            } else if (line.startsWith('data: ')) {
              const raw = line.slice(6)
              try {
                const data = JSON.parse(raw)
                // Reset fallback timer on any event
                if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current)
                fallbackTimeoutRef.current = setTimeout(() => {
                  if (!fallbackTriggered) fallbackToSync()
                }, 8000)

                switch (eventType) {
                  case 'stage-start':
                  case 'stage-complete':
                    setStages((prev) => {
                      const idx = prev.findIndex((s) => s.stageOrder === data.stageOrder)
                      if (idx >= 0) {
                        const updated = [...prev]
                        updated[idx] = data
                        return updated
                      }
                      return [...prev, data].sort((a, b) => a.stageOrder - b.stageOrder)
                    })
                    break

                  case 'complete':
                    setResult(data)
                    setLoading(false)
                    cleanup()
                    return

                  case 'error':
                    if (data.upgradeRequired) {
                      setError(data.error)
                    } else {
                      setResult({ success: false, error: data.error })
                    }
                    setLoading(false)
                    cleanup()
                    return

                  case 'needs-clarification':
                    setResult({
                      success: false,
                      error: `Prompt needs more detail: ${(data.detectedIssues || []).join('; ')}`,
                    })
                    setLoading(false)
                    cleanup()
                    return

                  default:
                    // job-created, etc. — ignore
                    break
                }
              } catch {
                // Malformed JSON line — skip
              }
            }
          }
        }

        // Stream ended without a 'complete' event — possible issue
        setLoading(false)
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') {
          // Network/fetch error — fallback to sync
          await fallbackToSync()
        }
      }
    }

    runStream()
  }, [reset])

  return { stages, result, loading, error, compile, reset }
}
