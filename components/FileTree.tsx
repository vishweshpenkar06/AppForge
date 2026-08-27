'use client'

import { useMemo } from 'react'
import { File, Folder, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileTreeProps {
  artifacts: Record<string, string>
  selectedFile: string | null
  onSelectFile: (path: string) => void
  modifiedFiles?: Set<string>
}

interface TreeNode {
  name: string
  path: string
  isFile: boolean
  children: TreeNode[]
}

function buildTree(files: string[]): TreeNode[] {
  const root: TreeNode[] = []

  for (const filePath of files) {
    const parts = filePath.split('/')
    let current = root

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isFile = i === parts.length - 1
      const path = parts.slice(0, i + 1).join('/')

      let existing = current.find((n) => n.name === part)
      if (!existing) {
        existing = { name: part, path, isFile, children: [] }
        current.push(existing)
      }
      if (!isFile) {
        current = existing.children
      }
    }
  }

  const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
    return nodes
      .sort((a, b) => {
        if (a.isFile !== b.isFile) return a.isFile ? 1 : -1
        return a.name.localeCompare(b.name)
      })
      .map((n) => ({ ...n, children: sortNodes(n.children) }))
  }

  return sortNodes(root)
}

function TreeItem({
  node,
  depth,
  selectedFile,
  onSelectFile,
  modifiedFiles,
}: {
  node: TreeNode
  depth: number
  selectedFile: string | null
  onSelectFile: (path: string) => void
  modifiedFiles?: Set<string>
}) {
  const isSelected = selectedFile === node.path
  const isModified = modifiedFiles?.has(node.path)

  if (node.isFile) {
    return (
      <button
        onClick={() => onSelectFile(node.path)}
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[13px] font-mono transition-colors',
          isSelected
            ? 'bg-accent/15 text-accent-hover'
            : 'text-forge-300 hover:bg-white/[0.04] hover:text-forge-100'
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <File className="h-3.5 w-3.5 shrink-0 text-forge-500" />
        <span className="truncate">{node.name}</span>
        {isModified && (
          <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
        )}
      </button>
    )
  }

  return (
    <div>
      <div
        className="flex items-center gap-2 px-2 py-1 text-[13px] font-medium text-forge-400"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <FolderOpen className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{node.name}</span>
      </div>
      <div>
        {node.children.map((child) => (
          <TreeItem
            key={child.path}
            node={child}
            depth={depth + 1}
            selectedFile={selectedFile}
            onSelectFile={onSelectFile}
            modifiedFiles={modifiedFiles}
          />
        ))}
      </div>
    </div>
  )
}

export default function FileTree({
  artifacts,
  selectedFile,
  onSelectFile,
  modifiedFiles,
}: FileTreeProps) {
  const tree = useMemo(() => buildTree(Object.keys(artifacts)), [artifacts])

  return (
    <div className="flex flex-col gap-0.5 overflow-auto py-1">
      {tree.map((node) => (
        <TreeItem
          key={node.path}
          node={node}
          depth={0}
          selectedFile={selectedFile}
          onSelectFile={onSelectFile}
          modifiedFiles={modifiedFiles}
        />
      ))}
    </div>
  )
}
