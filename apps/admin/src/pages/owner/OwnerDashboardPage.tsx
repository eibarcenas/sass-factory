import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/auth'
import { useOwnerItems, useOwnerUpdateItem, useOwnerAddItem, useOwnerDeleteItem } from '../../hooks/useItems'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { Item } from '../../hooks/useItems'
import { BusinessStatus } from '@catalog-mx/core'

const STOREFRONT_URL = import.meta.env.VITE_STOREFRONT_URL ?? 'http://localhost:3010'

// ── Product row ───────────────────────────────────────────────────────────────
function ProductRow({ item, businessId, readonly = false }: { item: Item; businessId: string; readonly?: boolean }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(item.name)
  const [price, setPrice] = useState(String(item.price))
  const [description, setDescription] = useState(item.description ?? '')
  const updateItem = useOwnerUpdateItem(businessId)
  const deleteItem = useOwnerDeleteItem(businessId)

  async function save() {
    await updateItem.mutateAsync({ itemId: item.id, patch: { name, price: Number(price), description } })
    setEditing(false)
  }

  if (editing) return (
    <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-2">
      <Input value={name} onChange={e => setName(e.target.value)} placeholder="Product name" />
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center border rounded-md overflow-hidden">
          <span className="px-2 text-sm text-muted-foreground border-r bg-muted">$</span>
          <input type="number" value={price} onChange={e => setPrice(e.target.value)}
            className="flex-1 px-2 py-1.5 text-sm focus:outline-none" min={0} />
          <span className="px-2 text-xs text-muted-foreground border-l bg-muted">MXN</span>
        </div>
        <div className="flex gap-1">
          <Button size="sm" onClick={save} disabled={updateItem.isPending} className="flex-1">
            {updateItem.isPending ? '...' : 'Save'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="flex-1">Cancel</Button>
        </div>
      </div>
      <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" />
    </div>
  )

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${!item.visible ? 'opacity-50' : ''}`}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.name}</p>
        {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
      </div>
      <span className="text-sm font-bold">${item.price.toLocaleString('es-MX')} MXN</span>
      {!readonly && (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>✏️</Button>
          <Button variant="ghost" size="sm" onClick={() => deleteItem.mutate(item.id)}
            disabled={deleteItem.isPending} className="text-destructive hover:text-destructive">
            🗑️
          </Button>
        </div>
      )}
    </div>
  )
}

// ── Add product form ──────────────────────────────────────────────────────────
function AddProduct({ businessId }: { businessId: string }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const addItem = useOwnerAddItem(businessId)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !price) return
    await addItem.mutateAsync({ name, price: Number(price), description: description || undefined, visible: true })
    setName(''); setPrice(''); setDescription(''); setOpen(false)
  }

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="w-full py-2 border-2 border-dashed border-muted-foreground/30 rounded-lg text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors">
      + Add product
    </button>
  )

  return (
    <form onSubmit={submit} className="p-3 rounded-lg border border-green-200 bg-green-50 space-y-2">
      <p className="text-xs font-semibold text-green-700">New product</p>
      <Input value={name} onChange={e => setName(e.target.value)} placeholder="Product name *" required />
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center border rounded-md overflow-hidden">
          <span className="px-2 text-sm text-muted-foreground border-r bg-muted">$</span>
          <input type="number" value={price} onChange={e => setPrice(e.target.value)}
            className="flex-1 px-2 py-1.5 text-sm focus:outline-none" min={0} required />
          <span className="px-2 text-xs text-muted-foreground border-l bg-muted">MXN</span>
        </div>
        <div className="flex gap-1">
          <Button type="submit" size="sm" disabled={addItem.isPending} className="flex-1 bg-green-600 hover:bg-green-700">
            {addItem.isPending ? '...' : 'Add'}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
        </div>
      </div>
      <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" />
    </form>
  )
}

// ── Appearance section ────────────────────────────────────────────────────────
function AppearanceSection({ businessId, currentTagline, readonly = false }: { businessId: string; currentTagline?: string; readonly?: boolean }) {
  const [tagline, setTagline] = useState(currentTagline ?? '')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (currentTagline !== undefined) setTagline(currentTagline)
  }, [currentTagline])
  const qc = useQueryClient()

  const save = useMutation({
    mutationFn: () => api.patch(`/api/v1/owner/business`, { tagline }),
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000); qc.invalidateQueries({ queryKey: ['owner-business'] }) },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Appearance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label>Tagline <span className="text-muted-foreground font-normal text-xs">({tagline.length}/120)</span></Label>
          <Input value={tagline} onChange={e => setTagline(e.target.value)} maxLength={120}
            placeholder="The best ice cream in Monterrey 🍦" disabled={readonly} />
        </div>
        {!readonly && (
          <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
            {saved ? '✓ Saved' : save.isPending ? 'Saving...' : 'Save'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
interface OwnerDashboardProps {
  previewSlug?: string
}

export default function OwnerDashboardPage({ previewSlug }: OwnerDashboardProps) {
  const { user } = useAuthStore()
  const isPreview = !!previewSlug

  // Preview mode: businessId comes from the URL slug
  // Normal mode: businessId comes from JWT claims (fallback to demo slug)
  const businessId = previewSlug ?? user?.businessId ?? 'heladeria-el-pinguino'

  const { data: bizData } = useQuery({
    queryKey: ['owner-business', businessId],
    queryFn: () => api.get<{ name: string; slug: string; tagline?: string; status: BusinessStatus }>(`/api/v1/storefront/${businessId}`),
  })

  const { data: itemsData } = useOwnerItems(businessId, previewSlug)
  const catalogUrl = `${STOREFRONT_URL}/demo/${businessId}`

  function copyLink() {
    navigator.clipboard.writeText(catalogUrl)
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(`Check out my catalog! 🛍️ ${catalogUrl}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-sm">{bizData?.name ?? 'My Catalog'}</h1>
            <p className="text-xs text-muted-foreground">{isPreview ? `Previewing as SUPER_ADMIN` : user?.email}</p>
          </div>
          <Badge variant={bizData?.status === BusinessStatus.Active ? 'default' : 'secondary'}>
            {bizData?.status ?? BusinessStatus.Demo}
          </Badge>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Preview banner */}
        {isPreview && (
          <div data-testid="preview-banner" className="flex items-center gap-2 p-3 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-800">
            <span>🔍</span>
            <span><strong>Previewing as owner</strong> — You are viewing this as SUPER_ADMIN. Read-only mode.</span>
          </div>
        )}

        {/* Catalog link */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your catalog link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <p className="text-xs font-mono text-muted-foreground flex-1 truncate">{catalogUrl}</p>
              <Button size="sm" variant="outline" onClick={copyLink}>Copy</Button>
            </div>
            {!isPreview && (
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={shareWhatsApp}>
                  📱 Share on WhatsApp
                </Button>
                <Button size="sm" variant="outline" className="flex-1" asChild>
                  <a href={catalogUrl} target="_blank" rel="noopener noreferrer">View catalog →</a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Products <span className="text-muted-foreground font-normal text-sm">({itemsData?.items.length ?? 0})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {itemsData?.items.map(item => (
              <ProductRow key={item.id} item={item} businessId={businessId} readonly={isPreview} />
            ))}
            {!isPreview && (
              <>
                <Separator className="my-2" />
                <AddProduct businessId={businessId} />
              </>
            )}
          </CardContent>
        </Card>

        {/* Appearance */}
        <AppearanceSection businessId={businessId} currentTagline={bizData?.tagline} readonly={isPreview} />

      </main>
    </div>
  )
}
