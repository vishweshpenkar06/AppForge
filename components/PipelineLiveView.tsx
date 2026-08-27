'use client'

import { useEffect, useState } from 'react'
import { useCompileStream, type StageUpdate } from '@/hooks/use-compile-stream'

const STAGE_LABELS = ['Intent', 'Design', 'Schemas', 'Refinement', 'Validation', 'Export']

interface PipelineLiveViewProps {
  prompt: string
  mode: string
  onResult: (result: any) => void
  onError: (error: string) => void
}

function stageStatus(stages: StageUpdate[], order: number): 'pending' | 'active' | 'done' {
  const s = stages.find((st) => st.stageOrder === order)
  if (!s) return 'pending'
  if (s.status === 'completed') return 'done'
  if (s.status === 'active') return 'active'
  return 'pending'
}

function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export default function PipelineLiveView({ prompt, mode, onResult, onError }: PipelineLiveViewProps) {
  const { stages, result, loading, error, compile } = useCompileStream()
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (prompt.trim()) {
      setStarted(true)
      compile(prompt, mode)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (result) onResult(result)
  }, [result, onResult])

  useEffect(() => {
    if (error) onError(error)
  }, [error, onError])

  if (!started && !loading) {
    return null
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Pipeline strip */}
      <div className="flex flex-col gap-2">
        {STAGE_LABELS.map((label, i) => {
          const order = i + 1
          const status = stageStatus(stages, order)
          const stageData = stages.find((s) => s.stageOrder === order)

          return (
            <div key={label} className="flex items-center gap-2.5">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 transition-all duration-300 ${
                  status === 'done'
                    ? 'bg-success text-white'
                    : status === 'active'
                      ? 'bg-accent text-white'
                      : 'border border-white/[0.06] text-forge-400'
                }`}
                style={
                  status === 'active'
                    ? { animation: 'pulse-dot 1.5s ease-in-out infinite' }
                    : undefined
                }
              >
                {status === 'done' ? '✓' : String(order)}
              </div>
              <span
                className={`text-xs font-mono transition-colors ${
                  status === 'done'
                    ? 'text-forge-300'
                    : status === 'active'
                      ? 'text-forge-50'
                      : 'text-forge-400'
                }`}
              >
                {label}
              </span>
              {stageData?.latencyMs !== undefined && status === 'done' && (
                <span className="text-[10px] font-mono text-forge-500 ml-auto">
                  {formatLatency(stageData.latencyMs)}
                </span>
              )}
              {status === 'active' && (
                <span className="text-[10px] font-mono text-accent ml-auto animate-pulse">
                  running...
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3 rounded-xl border border-danger/30 bg-danger-subtle">
          <p className="text-[11px] font-semibold text-danger m-0 mb-1">Stream Error</p>
          <p className="text-[11px] text-forge-300 font-mono m-0">{error}</p>
        </div>
      )}
    </div>
  )
}
