'use client'

import { useState, useEffect, useCallback } from 'react'
import { Save, Check, AlertCircle, Code2 } from 'lucide-react'
import FileTree from '@/components/FileTree'
import CodeEditor from '@/components/CodeEditor'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ArtifactEditorProps {
  generationId: string
}

interface ArtifactOverride {
  content: string
  editedAt: string
}

export default function ArtifactEditor({ generationId }: ArtifactEditorProps) {
  const [artifacts, setArtifacts] = useState<Record<string, string>>({})
  const [overrides, setOverrides] = useState<Record<string, ArtifactOverride>>({})
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [modifiedFiles, setModifiedFiles] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchArtifacts() {
      try {
        const res = await fetch(`/api/generations/${generationId}/artifacts`)
        if (!res.ok) throw new Error('Failed to load artifacts')
        const data = await res.json()
        setArtifacts(data.artifacts || {})
        setOverrides(data.overrides || {})

        // Auto-select the first file
        const files = Object.keys(data.artifacts || {})
        if (files.length > 0) {
          setSelectedFile(files[0])
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load artifacts')
      } finally {
        setLoading(false)
      }
    }
    fetchArtifacts()
  }, [generationId])

  const handleContentChange = useCallback(
    (value: string) => {
      if (!selectedFile) return
      setArtifacts((prev) => ({ ...prev, [selectedFile]: value }))
      setModifiedFiles((prev) => new Set(prev).add(selectedFile))
    },
    [selectedFile]
  )

  const handleSave = useCallback(async () => {
    if (!selectedFile) return
    setSaving(true)
    try {
      const res = await fetch(`/api/generations/${generationId}/artifacts`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: selectedFile,
          content: artifacts[selectedFile],
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      const data = await res.json()

      setOverrides((prev) => ({
        ...prev,
        [selectedFile]: { content: artifacts[selectedFile], editedAt: data.editedAt },
      }))
      setModifiedFiles((prev) => {
        const next = new Set(prev)
        next.delete(selectedFile)
        return next
      })
      toast.success('File saved', { description: `${selectedFile} updated` })
    } catch (e) {
      toast.error('Save failed', {
        description: e instanceof Error ? e.message : 'Unknown error',
      })
    } finally {
      setSaving(false)
    }
  }, [selectedFile, artifacts, generationId])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    },
    [handleSave]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-sm text-forge-400">
        Loading artifacts...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger-subtle px-4 py-3 text-sm text-danger">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      </div>
    )
  }

  const files = Object.keys(artifacts)
  if (files.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center text-sm text-forge-400">
        No artifacts found for this generation.
      </div>
    )
  }

  const currentContent = selectedFile ? artifacts[selectedFile] || '' : ''
  const isModified = selectedFile ? modifiedFiles.has(selectedFile) : false
  const override = selectedFile ? overrides[selectedFile] : undefined

  return (
    <div className="flex h-[600px] rounded-xl border border-white/[0.06] bg-forge-900 overflow-hidden">
      {/* File tree sidebar */}
      <div className="w-56 shrink-0 border-r border-white/[0.06] bg-forge-950/50 overflow-auto">
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2.5">
          <Code2 className="h-3.5 w-3.5 text-forge-500" />
          <span className="text-[11px] font-medium text-forge-400 uppercase tracking-wider">
            Files
          </span>
          <span className="ml-auto text-[10px] text-forge-500">{files.length}</span>
        </div>
        <FileTree
          artifacts={artifacts}
          selectedFile={selectedFile}
          onSelectFile={setSelectedFile}
          modifiedFiles={modifiedFiles}
        />
      </div>

      {/* Editor area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Editor toolbar */}
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-2 bg-forge-950/50">
          <span className="text-[13px] font-mono text-forge-200 truncate">
            {selectedFile || 'Select a file'}
          </span>
          {override && (
            <span className="text-[10px] text-forge-500 font-mono">
              Last edited: {new Date(override.editedAt).toLocaleString()}
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            {isModified && (
              <span className="text-[11px] text-accent font-mono">Modified</span>
            )}
            <Button
              size="sm"
              variant={isModified ? 'default' : 'secondary'}
              onClick={handleSave}
              disabled={!selectedFile || saving || !isModified}
              className="h-7 gap-1.5 text-[12px]"
            >
              {saving ? (
                <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
              ) : isModified ? (
                <Save className="h-3 w-3" />
              ) : (
                <Check className="h-3 w-3" />
              )}
              {saving ? 'Saving...' : 'Saved'}
            </Button>
          </div>
        </div>

        {/* Monaco editor */}
        <div className="flex-1 min-h-0">
          {selectedFile ? (
            <CodeEditor
              key={selectedFile}
              filePath={selectedFile}
              content={currentContent}
              onChange={handleContentChange}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-forge-500">
              Select a file to edit
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
