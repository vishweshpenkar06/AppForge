'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { KeyRound, Plus, Trash2, Copy, Check, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

interface ApiKeyEntry {
  id: string
  label: string
  lastUsedAt: string | null
  createdAt: string
}

export default function ApiKeysPage() {
  const { user } = useUser()
  const [keys, setKeys] = useState<ApiKeyEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [creating, setCreating] = useState(false)
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null)

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/keys')
      const data = await res.json()
      setKeys(data.keys ?? [])
    } catch {
      toast.error('Failed to load API keys.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchKeys()
  }, [fetchKeys])

  const handleCreate = async () => {
    if (!newLabel.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newLabel.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to create key.')
        return
      }
      setGeneratedKey(data.plaintext)
      setKeys((prev) => [
        { id: data.id, label: data.label, lastUsedAt: null, createdAt: data.createdAt },
        ...prev,
      ])
      setNewLabel('')
    } catch {
      toast.error('Failed to create key.')
    } finally {
      setCreating(false)
    }
  }

  const handleCopy = async () => {
    if (!generatedKey) return
    await navigator.clipboard.writeText(generatedKey)
    setCopied(true)
    toast.success('API key copied to clipboard.')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRevoke = async (id: string) => {
    setRevokingId(id)
    try {
      const res = await fetch(`/api/keys/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to revoke key.')
        return
      }
      setKeys((prev) => prev.filter((k) => k.id !== id))
      toast.success('API key revoked.')
    } catch {
      toast.error('Failed to revoke key.')
    } finally {
      setRevokingId(null)
      setConfirmRevoke(null)
    }
  }

  const closeGeneratedDialog = () => {
    setGeneratedKey(null)
    setShowKey(false)
    setCopied(false)
  }

  const plan = user?.publicMetadata?.plan as string | undefined
  const canCreateKeys = plan === 'pro' || plan === 'team'

  return (
    <div className="min-h-screen px-4 py-10 md:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-forge-50 flex items-center gap-2">
            <KeyRound className="size-6 text-accent" />
            API Keys
          </h1>
          <p className="mt-2 text-sm text-forge-400">
            Generate scoped API keys to call the AppForge compiler programmatically.
            Keys are shown once at creation — store them securely.
          </p>
        </div>

        {!canCreateKeys && (
          <Card className="mb-6">
            <CardContent>
              <p className="text-sm text-forge-300">
                API keys are available on <strong className="text-forge-100">Pro</strong> and{' '}
                <strong className="text-forge-100">Team</strong> plans.{' '}
                <a href="/pricing" className="text-accent hover:underline">
                  Upgrade your plan
                </a>{' '}
                to enable programmatic access.
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Active Keys</CardTitle>
                <CardDescription>
                  {keys.length} key{keys.length !== 1 ? 's' : ''} configured
                </CardDescription>
              </div>
              {canCreateKeys && (
                <Button
                  size="sm"
                  onClick={() => {
                    setCreateOpen(true)
                    setNewLabel('')
                    setGeneratedKey(null)
                  }}
                >
                  <Plus className="size-4" />
                  Generate Key
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="size-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              </div>
            ) : keys.length === 0 ? (
              <div className="py-8 text-center text-sm text-forge-400">
                No API keys yet. Generate one to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Label</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium text-forge-100">
                        {key.label}
                      </TableCell>
                      <TableCell className="text-forge-400">
                        {formatDate(key.createdAt)}
                      </TableCell>
                      <TableCell className="text-forge-400">
                        {key.lastUsedAt ? (
                          formatDate(key.lastUsedAt)
                        ) : (
                          <Badge variant="outline" className="border-forge-700 text-forge-500">
                            Never
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-forge-500 hover:text-danger"
                          disabled={revokingId === key.id}
                          onClick={() => setConfirmRevoke(key.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Create Key Dialog ──────────────────────────────── */}
      <Dialog open={createOpen && !generatedKey} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate API Key</DialogTitle>
            <DialogDescription>
              Give your key a label so you can identify it later.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="e.g. CI pipeline, local dev, mobile app"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            maxLength={100}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newLabel.trim() || creating}>
              {creating ? 'Generating...' : 'Generate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Show-Once Key Dialog ────────────────────────────── */}
      <Dialog open={!!generatedKey} onOpenChange={closeGeneratedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your API Key</DialogTitle>
            <DialogDescription>
              Copy this key now. It will <strong>not</strong> be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Input
              readOnly
              type={showKey ? 'text' : 'password'}
              value={generatedKey ?? ''}
              className="pr-20 font-mono text-xs"
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={handleCopy}>
                {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={closeGeneratedDialog}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirm Revoke Dialog ───────────────────────────── */}
      <Dialog open={!!confirmRevoke} onOpenChange={() => setConfirmRevoke(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke API Key</DialogTitle>
            <DialogDescription>
              This action is permanent. Any application using this key will immediately lose access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRevoke(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmRevoke && handleRevoke(confirmRevoke)}
              disabled={!!revokingId}
            >
              {revokingId ? 'Revoking...' : 'Revoke Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
