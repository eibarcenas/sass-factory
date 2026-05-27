import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/auth'
import { useOwnerItems, useOwnerUpdateItem, useOwnerAddItem, useOwnerDeleteItem } from '../../hooks/useItems'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import ImageUpload from '../../components/demos/ImageUpload'
import AppSidebar from '../../components/layout/AppSidebar'
import type { NavItem } from '../../components/layout/AppSidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { Item } from '../../hooks/useItems'
import { BusinessStatus } from '@eguru/core'

const STOREFRONT_URL = import.meta.env.VITE_STOREFRONT_URL ?? 'http://localhost:3010'

type Page = 'catalog' | 'appearance'

// ── Product row ───────────────────────────────────────────────────────────────
function ProductRow({ item, businessId, readonly = false }: { item: Item; businessId: string; readonly?: boolean }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(item.name)
  const [price, setPrice] = useState(String(item.price))
  const [description, setDescription] = useState(item.description ?? '')
  const [image, setImage] = useState(item.image ?? '')
  const updateItem = useOwnerUpdateItem(businessId)
  const deleteItem = useOwnerDeleteItem(businessId)

  async function save() {
    await updateItem.mutateAsync({ itemId: item.id, patch: { name, price: Number(price), description, image: image || undefined } })
    setEditing(false)
  }

  if (editing) return (
    <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-2">
      <Input value={name} onChange={e => setName(e.target.value)} placeholder="Product name" />
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center rounded-md border border-input bg-background overflow-hidden">
          <span className="px-2 text-sm text-muted-foreground border-r bg-muted">$</span>
          <Input type="number" value={price} onChange={e => setPrice(e.target.value)}
            className="border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0" min={0} />
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
      <ImageUpload currentUrl={image} onUploaded={url => setImage(url)} folder="products" />
    </div>
  )

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${!item.visible ? 'opacity-50' : ''}`}>
      {item.image ? (
        <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-border" />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-lg">📦</div>
      )}
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
    <Button variant="outline" onClick={() => setOpen(true)}
      className="w-full border-dashed text-muted-foreground hover:text-primary">
      + Add product
    </Button>
  )

  return (
    <form onSubmit={submit} className="p-3 rounded-lg border border-green-200 bg-green-50 space-y-2">
      <p className="text-xs font-semibold text-green-700">New product</p>
      <Input value={name} onChange={e => setName(e.target.value)} placeholder="Product name *" required />
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center rounded-md border border-input bg-background overflow-hidden">
          <span className="px-2 text-sm text-muted-foreground border-r bg-muted">$</span>
          <Input type="number" value={price} onChange={e => setPrice(e.target.value)}
            className="border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0" min={0} required />
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

const OWNER_NAV: NavItem<Page>[] = [
  { key: 'catalog',    icon: '🛍️', label: 'My Products' },
  { key: 'appearance', icon: '🎨', label: 'Appearance' },
]

// ── Catalog page (link + products) ───────────────────────────────────────────
function CatalogPage({ businessId, previewSlug, catalogUrl, isPreview }: {
  businessId: string
  previewSlug?: string
  catalogUrl: string
  isPreview: boolean
}) {
  const { data: itemsData } = useOwnerItems(businessId, previewSlug)

  function copyLink() { navigator.clipboard.writeText(catalogUrl) }
  function shareWhatsApp() {
    const text = encodeURIComponent(`Check out my catalog! 🛍️ ${catalogUrl}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Products</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your catalog</p>
      </div>

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
    </div>
  )
}

// ── Appearance page ───────────────────────────────────────────────────────────
function AppearancePage({ businessId, currentTagline, currentWhatsapp, readonly = false }: {
  businessId: string
  currentTagline?: string
  currentWhatsapp?: string
  readonly?: boolean
}) {
  const [tagline, setTagline] = useState(currentTagline ?? '')
  const [whatsapp, setWhatsapp] = useState(currentWhatsapp ?? '')
  const [saved, setSaved] = useState(false)
  const qc = useQueryClient()

  useEffect(() => {
    if (currentTagline !== undefined) setTagline(currentTagline)
  }, [currentTagline])

  useEffect(() => {
    if (currentWhatsapp !== undefined) setWhatsapp(currentWhatsapp)
  }, [currentWhatsapp])

  const save = useMutation({
    mutationFn: () => api.patch(`/api/v1/owner/business`, { tagline, whatsapp }),
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000); qc.invalidateQueries({ queryKey: ['owner-business'] }) },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Appearance</h1>
        <p className="text-muted-foreground text-sm mt-1">Customize how your catalog looks</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tagline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Tagline <span className="text-muted-foreground font-normal text-xs">({tagline.length}/120)</span></Label>
            <Input value={tagline} onChange={e => setTagline(e.target.value)} maxLength={120}
              placeholder="The best ice cream in Monterrey 🍦" disabled={readonly} />
          </div>
          <div className="space-y-1">
            <Label>WhatsApp number</Label>
            <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
              placeholder="+52 55 1234 5678" disabled={readonly} />
          </div>
          {!readonly && (
            <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
              {saved ? '✓ Saved' : save.isPending ? 'Saving...' : 'Save'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
interface OwnerDashboardProps {
  previewSlug?: string
}

export default function OwnerDashboardPage({ previewSlug }: OwnerDashboardProps) {
  const { user } = useAuthStore()
  const isPreview = !!previewSlug
  const businessId = previewSlug ?? user?.businessId ?? 'heladeria-el-pinguino'
  const [page, setPage] = useState<Page>('catalog')

  const { data: bizData } = useQuery({
    queryKey: ['owner-business', businessId],
    queryFn: () => api.get<{ name: string; slug: string; tagline?: string; whatsapp?: string; status: BusinessStatus }>(`/api/v1/storefront/${businessId}`),
  })

  const catalogUrl = `${STOREFRONT_URL}/demo/${businessId}`

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
      <AppSidebar
        nav={OWNER_NAV}
        active={page}
        onNavigate={setPage}
        headerSlot={bizData?.name && <p className="text-xs text-muted-foreground mt-0.5 truncate">{bizData.name}</p>}
        footerSlot={
          <div className="space-y-2">
            {isPreview && (
              <Badge variant="outline" className="w-full justify-center text-amber-700 border-amber-300 bg-amber-50">
                Preview mode
              </Badge>
            )}
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground truncate">
                {isPreview ? `Previewing: ${businessId}` : user?.email}
              </p>
              {bizData?.status && (
                <Badge variant={bizData.status === BusinessStatus.Active ? 'default' : 'secondary'} className="text-xs shrink-0">
                  {bizData.status}
                </Badge>
              )}
            </div>
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto p-8">
        {isPreview && (
          <div data-testid="preview-banner" className="mb-6 flex items-center gap-2 p-3 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-800">
            <span>🔍</span>
            <span><strong>Previewing as owner</strong> — You are viewing this as SUPER_ADMIN. Read-only mode.</span>
          </div>
        )}

        {page === 'catalog' && (
          <CatalogPage businessId={businessId} previewSlug={previewSlug} catalogUrl={catalogUrl} isPreview={isPreview} />
        )}
        {page === 'appearance' && (
          <AppearancePage businessId={businessId} currentTagline={bizData?.tagline} currentWhatsapp={bizData?.whatsapp} readonly={isPreview} />
        )}
      </main>
    </div>
  )
}
