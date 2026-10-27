"use client"

import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

const AUTOSAVE_KEY = 'appforge:editor:autosave'
const HISTORY_KEY = 'appforge:editor:history'

export default function BuilderEditor() {
  const [value, setValue] = useState<string>('')
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any | null>(null)
  const [history, setHistory] = useState<Array<{ id: string; text: string; when: string }>>([])
  const timer = useRef<number | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY)
      if (saved) setValue(saved)

      const hist = localStorage.getItem(HISTORY_KEY)
      if (hist) setHistory(JSON.parse(hist))
    } catch (e) {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(AUTOSAVE_KEY, value)
        setStatus('Saved')
      } catch (e) {
        setStatus('Save failed')
      }
    }, 700) as unknown as number

    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [value])

  function saveToHistory() {
    const item = { id: String(Date.now()), text: value, when: new Date().toISOString() }
    const next = [item, ...history].slice(0, 50)
    setHistory(next)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
    setStatus('Saved to history')
  }

  function restore(id: string) {
    const item = history.find((h) => h.id === id)
    if (item) setValue(item.text)
  }

  function removeHistory(id: string) {
    const next = history.filter((h) => h.id !== id)
    setHistory(next)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  }

  function clearAutosave() {
    localStorage.removeItem(AUTOSAVE_KEY)
    setStatus('Cleared autosave')
    setValue('')
  }

  async function compilePrompt() {
    setLoading(true)
    setStatus('Compiling...')
    setResult(null)
    try {
      const res = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: value }),
      })

      const data = await res.json()

      if (!res.ok) {
        setStatus(`Compile failed: ${data?.error || res.statusText}`)
        setResult(data)
      } else {
        setStatus('Compile succeeded')
        setResult(data)
      }
    } catch (e: any) {
      setStatus('Compile error')
      setResult({ success: false, error: String(e) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <section className="lg:col-span-7 rounded-2xl border border-white/[0.06] bg-forge-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Prompt Editor</h3>
          <div className="flex items-center gap-2 text-xs text-forge-400">
            <span>{status}</span>
            <Button size="sm" variant="ghost" onClick={saveToHistory}>Save</Button>
            <Button size="sm" variant="outline" onClick={clearAutosave}>Clear</Button>
            <Button size="sm" onClick={compilePrompt} disabled={loading || value.trim().length===0}>
              {loading ? 'Compiling...' : 'Compile'}
            </Button>
          </div>
        </div>

        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={`Describe the app you want to build. Example: "A CRM for field sales with role-based dashboards, contact management, and subscription billing."`}
          className="w-full min-h-[320px] resize-y rounded-lg bg-forge-700 p-3 text-sm leading-6 outline-none border border-white/[0.06] text-forge-50 font-mono placeholder:text-forge-500 focus:border-accent transition-colors"
        />
      </section>

      <aside className="lg:col-span-5 rounded-2xl border border-white/[0.06] bg-forge-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold">History</h4>
          <span className="text-xs text-forge-400">{history.length} saved</span>
        </div>

        <div className="space-y-2 max-h-[480px] overflow-auto">
          {history.length === 0 && <p className="text-xs text-forge-400">No saved prompts yet.</p>}
          {history.map((h) => (
            <div key={h.id} className="rounded-lg border border-white/[0.06] bg-forge-700 p-2">
              <div className="flex items-start justify-between gap-2">
                <div className="text-xs text-forge-200">{new Date(h.when).toLocaleString()}</div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => restore(h.id)}>Restore</Button>
                  <Button size="sm" variant="ghost" onClick={() => removeHistory(h.id)}>Delete</Button>
                </div>
              </div>
              <p className="mt-2 text-sm text-forge-400 line-clamp-3">{h.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <h5 className="text-sm font-semibold">Last Compile Result</h5>
          {!result && <p className="text-xs text-forge-400">No compile run yet.</p>}
          {result && (
            <div className="mt-2 text-xs text-forge-200">
              <div className="mb-2">
                <strong>Status:</strong> {String(result.success)}
              </div>
              {result.error && (
                <div className="mb-2 text-danger">Error: {String(result.error)}</div>
              )}
              {result.docs && (
                <div className="mb-2">
                  <div className="font-semibold">Docs</div>
                  <div className="text-xs mt-1 space-y-1">
                    <div>PRD: {String(result.docs.prd).slice(0, 120)}...</div>
                    <div>TRD: {String(result.docs.trd).slice(0, 120)}...</div>
                  </div>
                </div>
              )}
              {result.implementationPlan && (
                <div className="mb-2">
                  <div className="font-semibold">Plan</div>
                  <div className="text-xs mt-1">{String(result.implementationPlan.summary || '').slice(0, 200)}</div>
                </div>
              )}
              {result.downloadUrl && (
                <div className="mt-2">
                  <a href={result.downloadUrl} target="_blank" rel="noreferrer" className="text-accent-hover underline">Download generated package</a>
                </div>
              )}
              <details className="mt-2 text-xs text-forge-400">
                <summary className="cursor-pointer">Full response</summary>
                <pre className="whitespace-pre-wrap mt-2">{JSON.stringify(result, null, 2)}</pre>
              </details>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
