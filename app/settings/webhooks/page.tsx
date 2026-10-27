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
import { Webhook, Plus, Trash2, Copy, Check, Send } from 'lucide-react'
import { toast } from 'sonner'

const AVAILABLE_EVENTS = [
  { value: 'generation.completed', label: 'Generation completed' },
  { value: 'generation.failed', label: 'Generation failed' },
] as const

interface WebhookEndpointEntry {
  id: string
  url: string
  events: string[]
  isActive: boolean
  createdAt: string
}

export default function WebhooksPage() {
  const { user } = useUser()
  const [endpoints, setEndpoints] = useState<WebhookEndpointEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [newEvents, setNewEvents] = useState<string[]>(['generation.completed'])
  const [creating, setCreating] = useState(false)
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null)
  const [showSecret, setShowSecret] = useState(false)
  const [copied, setCopied] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)

  const fetchEndpoints = useCallback(async () => {
    try {
      const res = await fetch('/api/webhooks/outbound')
      const data = await res.json()
      setEndpoints(data.endpoints ?? [])
    } catch {
      toast.error('Failed to load webhook endpoints.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEndpoints()
  }, [fetchEndpoints])

  const handleCreate = async () => {
    if (!newUrl.trim() || newEvents.length === 0) return
    setCreating(true)
    try {
      const res = await fetch('/api/webhooks/outbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl.trim(), events: newEvents }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to create webhook endpoint.')
        return
      }
      setGeneratedSecret(data.secret)
      setEndpoints((prev) => [
        {
          id: data.id,
          url: data.url,
          events: data.events,
          isActive: true,
          createdAt: data.createdAt,
        },
        ...prev,
      ])
      setNewUrl('')
      setNewEvents(['generation.completed'])
    } catch {
      toast.error('Failed to create webhook endpoint.')
    } finally {
      setCreating(false)
    }
  }

  const handleCopy = async () => {
    if (!generatedSecret) return
    await navigator.clipboard.writeText(generatedSecret)
    setCopied(true)
    toast.success('Signing secret copied to clipboard.')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/webhooks/outbound?id=${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete endpoint.')
        return
      }
      setEndpoints((prev) => prev.filter((ep) => ep.id !== id))
      toast.success('Webhook endpoint deleted.')
    } catch {
      toast.error('Failed to delete endpoint.')
    } finally {
      setDeletingId(null)
      setConfirmDelete(null)
    }
  }

  const handleTest = async (endpoint: WebhookEndpointEntry) => {
    setTestingId(endpoint.id)
    try {
      // Send a test ping to the endpoint
      const res = await fetch(endpoint.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'test.ping',
          timestamp: new Date().toISOString(),
          data: { message: 'This is a test webhook from AppForge.', endpointId: endpoint.id },
        }),
        signal: AbortSignal.timeout(10_000),
      })
      if (res.ok) {
        toast.success('Test ping delivered successfully.')
      } else {
        toast.error(`Endpoint returned status ${res.status}.`)
      }
    } catch {
      toast.error('Failed to reach the endpoint.')
    } finally {
      setTestingId(null)
    }
  }

  const closeSecretDialog = () => {
    setGeneratedSecret(null)
    setShowSecret(false)
    setCopied(false)
  }

  const plan = user?.publicMetadata?.plan as string | undefined
  const canCreateWebhooks = plan === 'pro' || plan === 'team'

  return (
    <div className="min-h-screen px-4 py-10 md:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-forge-50 flex items-center gap-2">
            <Webhook className="size-6 text-accent" />
            Webhooks
          </h1>
          <p className="mt-2 text-sm text-forge-400">
            Get notified when generation jobs complete or fail. Payloads are signed
            with HMAC-SHA256 so you can verify authenticity.
          </p>
        </div>

        {!canCreateWebhooks && (
          <Card className="mb-6">
            <CardContent>
              <p className="text-sm text-forge-300">
                Webhooks are available on <strong className="text-forge-100">Pro</strong> and{' '}
                <strong className="text-forge-100">Team</strong> plans.{' '}
                <a href="/pricing" className="text-accent hover:underline">
                  Upgrade your plan
                </a>{' '}
                to enable webhook notifications.
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Endpoints</CardTitle>
                <CardDescription>
                  {endpoints.length} endpoint{endpoints.length !== 1 ? 's' : ''} configured
                </CardDescription>
              </div>
              {canCreateWebhooks && (
                <Button
                  size="sm"
                  onClick={() => {
                    setCreateOpen(true)
                    setNewUrl('')
                    setNewEvents(['generation.completed'])
                    setGeneratedSecret(null)
                  }}
                >
                  <Plus className="size-4" />
                  Add Endpoint
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="size-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              </div>
            ) : endpoints.length === 0 ? (
              <div className="py-8 text-center text-sm text-forge-400">
                No webhook endpoints yet. Add one to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {endpoints.map((ep) => (
                    <TableRow key={ep.id}>
                      <TableCell className="font-medium text-forge-100 max-w-[280px] truncate">
                        {ep.url}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {ep.events.map((evt) => (
                            <Badge key={evt} variant="secondary" className="text-[10px]">
                              {evt}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {ep.isActive ? (
                          <Badge variant="default" className="bg-success/20 text-success border-success/30">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-forge-700 text-forge-500">
                            Disabled
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-forge-400 hover:text-accent"
                            disabled={testingId === ep.id}
                            onClick={() => handleTest(ep)}
                            title="Send test ping"
                          >
                            <Send className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-forge-500 hover:text-danger"
                            disabled={deletingId === ep.id}
                            onClick={() => setConfirmDelete(ep.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Verifying Webhooks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-forge-300 mb-3">
              Each webhook payload is signed with HMAC-SHA256. Verify the signature
              using the <code className="text-xs bg-forge-800 px-1 py-0.5 rounded">X-AppForge-Signature</code> header.
            </p>
            <pre className="bg-forge-800 border border-white/[0.06] rounded-lg p-4 text-xs text-forge-200 overflow-x-auto">
{`import crypto from 'crypto'

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(signature.replace('sha256=', '')),
    Buffer.from(expected)
  )
}`}
            </pre>
          </CardContent>
        </Card>
      </div>

      {/* ── Create Endpoint Dialog ─────────────────────────── */}
      <Dialog open={createOpen && !generatedSecret} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Webhook Endpoint</DialogTitle>
            <DialogDescription>
              Enter the URL that should receive webhook notifications.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="https://your-server.com/webhooks/appforge"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            maxLength={500}
          />
          <div>
            <p className="text-sm text-forge-400 mb-2">Events to subscribe to:</p>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_EVENTS.map((evt) => (
                <label
                  key={evt.value}
                  className="flex items-center gap-2 text-sm text-forge-200 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={newEvents.includes(evt.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewEvents((prev) => [...prev, evt.value])
                      } else {
                        setNewEvents((prev) => prev.filter((v) => v !== evt.value))
                      }
                    }}
                    className="rounded border-forge-600"
                  />
                  {evt.label}
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newUrl.trim() || newEvents.length === 0 || creating}
            >
              {creating ? 'Creating...' : 'Create Endpoint'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Show-Once Secret Dialog ────────────────────────── */}
      <Dialog open={!!generatedSecret} onOpenChange={closeSecretDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your Signing Secret</DialogTitle>
            <DialogDescription>
              Copy this secret now. It will <strong>not</strong> be shown again.
              Use it to verify incoming webhook signatures.
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Input
              readOnly
              type={showSecret ? 'text' : 'password'}
              value={generatedSecret ?? ''}
              className="pr-20 font-mono text-xs"
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? (
                  <span className="size-3.5">🙈</span>
                ) : (
                  <span className="size-3.5">👁</span>
                )}
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={handleCopy}>
                {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={closeSecretDialog}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirm Delete Dialog ──────────────────────────── */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Webhook Endpoint</DialogTitle>
            <DialogDescription>
              This will permanently remove the endpoint. No more events will be sent to this URL.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
              disabled={!!deletingId}
            >
              {deletingId ? 'Deleting...' : 'Delete Endpoint'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
