'use client'

import { useRef, useCallback } from 'react'
import Editor, { type OnMount, type OnChange } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'

function getLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'ts':
    case 'tsx':
      return 'typescript'
    case 'js':
    case 'jsx':
      return 'javascript'
    case 'json':
      return 'json'
    case 'md':
      return 'markdown'
    case 'prisma':
      return 'prisma'
    case 'css':
      return 'css'
    case 'html':
      return 'html'
    case 'yaml':
    case 'yml':
      return 'yaml'
    case 'sql':
      return 'sql'
    default:
      return 'plaintext'
  }
}

interface CodeEditorProps {
  filePath: string
  content: string
  onChange?: (value: string) => void
  readOnly?: boolean
}

export default function CodeEditor({
  filePath,
  content,
  onChange,
  readOnly = false,
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  const handleMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor

      monaco.editor.defineTheme('appforge-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#0a0e1a',
          'editor.foreground': '#e2e8f0',
          'editor.lineHighlightBackground': '#1e293b40',
          'editor.selectionBackground': '#6366f140',
          'editorCursor.foreground': '#6366f1',
        },
      })
      monaco.editor.setTheme('appforge-dark')
    },
    []
  )

  const handleChange: OnChange = useCallback(
    (value) => {
      if (value !== undefined) {
        onChange?.(value)
      }
    },
    [onChange]
  )

  return (
    <div className="h-full w-full overflow-hidden rounded-b-xl">
      <Editor
        key={filePath}
        language={getLanguage(filePath)}
        value={content}
        theme="appforge-dark"
        onChange={handleChange}
        onMount={handleMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: "'Geist Mono', 'Fira Code', 'Cascadia Code', monospace",
          lineHeight: 22,
          padding: { top: 12, bottom: 12 },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true,
          renderLineHighlight: 'line',
          cursorBlinking: 'smooth',
          smoothScrolling: true,
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: true },
          tabSize: 2,
          formatOnPaste: true,
        }}
        loading={
          <div className="flex h-full items-center justify-center text-sm text-forge-500">
            Loading editor...
          </div>
        }
      />
    </div>
  )
}
