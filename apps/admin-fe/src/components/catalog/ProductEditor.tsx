import ImageUpload from './ImageUpload'
import { useState } from 'react'
import { useItems, useAddItem, useUpdateItem, useDeleteItem, useSellerItems, useSellerAddItem, useSellerUpdateItem, useSellerDeleteItem, type Item } from '../../hooks/useItems'
import { Button } from '@/components/ui/button'

type Scope = 'admin' | 'seller' | 'draft'

export interface DraftProduct {
  id: string
  name: string
  price: number
  description: string
  images: string[]
}

export function isDraftProductComplete(product: DraftProduct) {
  return (
    product.name.trim().length >= 2
    && product.price > 0
    && product.description.trim().length >= 2
    && product.images.length > 0
  )
}

// ── Shared form fields ────────────────────────────────────────────────────────

interface FormFieldsProps {
  form: { name: string; price: number; description: string; images: string[] }
  onChange: (patch: Partial<{ name: string; price: number; description: string; images: string[] }>) => void
  focusColor: 'indigo' | 'green'
  required?: boolean
  requireImage?: boolean
  uploadPath?: string
  actionSlot: React.ReactNode
}

function ProductFormFields({ form, onChange, focusColor, required, requireImage, uploadPath, actionSlot }: FormFieldsProps) {
  const ring = focusColor === 'indigo' ? 'focus:ring-indigo-500' : 'focus:ring-green-500'
  const priceRing = focusColor === 'indigo' ? 'focus-within:ring-indigo-500' : 'focus-within:ring-green-500'
  return (
    <>
      <input
        value={form.name}
        onChange={e => onChange({ name: e.target.value })}
        placeholder="Product name"
        required={required}
        className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 ${ring}`}
      />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className={`flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 ${priceRing}`}>
          <span className="px-2 py-2 bg-gray-50 text-gray-400 text-sm border-r">$</span>
          <input
            type="number"
            value={form.price || ''}
            onChange={e => onChange({ price: Math.min(Math.max(0, Number(e.target.value)), 999999) })}
            placeholder="0"
            required={required}
            min={0}
            max={999999}
            step={1}
            className="flex-1 px-2 py-2 text-sm focus:outline-none"
          />
          <span className="px-2 py-2 bg-gray-50 text-gray-400 text-xs border-l">MXN</span>
        </div>
        <div className="flex gap-2">{actionSlot}</div>
      </div>
      <input
        value={form.description}
        onChange={e => onChange({ description: e.target.value })}
        placeholder={required ? 'Descripción del producto' : 'Description (optional)'}
        required={required}
        className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 ${ring}`}
      />
      <ImageUpload
        currentUrls={form.images}
        onChanged={urls => onChange({ images: urls })}
        folder="products"
        uploadPath={uploadPath}
      />
      {requireImage && form.images.length === 0 && (
        <p className="text-xs text-muted-foreground">Agrega al menos una foto del producto.</p>
      )}
    </>
  )
}

// ── Item row ──────────────────────────────────────────────────────────────────

interface RowProps {
  item: Item
  businessId: string
  scope: Scope
  readonly?: boolean
  impersonateSlug?: string
  draft?: boolean
  uploadPath?: string
  onDraftChange?: (product: DraftProduct) => void
  onDraftRemove?: (productId: string) => void
  onSaved: () => void
}

function ItemRow({
  item,
  businessId,
  scope,
  readonly = false,
  impersonateSlug,
  draft = false,
  uploadPath,
  onDraftChange,
  onDraftRemove,
  onSaved,
}: RowProps) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: item.name,
    price: item.price,
    description: item.description ?? '',
    images: item.images ?? (item.image ? [item.image] : []) as string[],
  })
  const adminUpdate = useUpdateItem(businessId)
  const sellerUpdate = useSellerUpdateItem(businessId, impersonateSlug)
  const adminDelete = useDeleteItem(businessId)
  const sellerDelete = useSellerDeleteItem(businessId, impersonateSlug)
  const updateItem = scope === 'seller' ? sellerUpdate : adminUpdate
  const deleteItem = scope === 'seller' ? sellerDelete : adminDelete

  async function save() {
    if (draft) {
      const product = { id: item.id, ...form }
      if (!isDraftProductComplete(product)) return
      onDraftChange?.(product)
      setEditing(false)
      return
    }
    await updateItem.mutateAsync({
      itemId: item.id,
      patch: {
        name: form.name,
        price: form.price,
        description: form.description,
        images: form.images,
        image: form.images[0] ?? null,
      },
    })
    setEditing(false)
    onSaved()
  }

  async function remove() {
    if (draft) {
      onDraftRemove?.(item.id)
      return
    }
    if (!confirm(`Delete "${item.name}"?`)) return
    await deleteItem.mutateAsync(item.id)
  }

  const thumbnail = item.images?.[0] ?? item.image

  if (readonly) return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${item.visible ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
      {thumbnail
        ? <img src={thumbnail} alt={item.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
        : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-lg">📦</div>
      }
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
        {item.description && <p className="text-xs text-gray-400 truncate">{item.description}</p>}
      </div>
      <span className="text-sm font-bold text-gray-900 flex-shrink-0">${item.price.toLocaleString('es-MX')}</span>
    </div>
  )

  if (editing) return (
    <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 space-y-2">
      <ProductFormFields
        form={form}
        onChange={patch => setForm(f => ({ ...f, ...patch }))}
        focusColor="indigo"
        required={draft}
        requireImage={draft}
        uploadPath={uploadPath}
        actionSlot={
          <>
            <Button
              type="button"
              size="sm"
              onClick={save}
              disabled={updateItem.isPending || (draft && !isDraftProductComplete({ id: item.id, ...form }))}
              className="flex-1"
            >
              {updateItem.isPending ? '...' : draft ? 'Guardar' : 'Save'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setEditing(false)}
              className="flex-1"
            >
              {draft ? 'Cancelar' : 'Cancel'}
            </Button>
          </>
        }
      />
    </div>
  )

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${item.visible ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
      {thumbnail
        ? <img src={thumbnail} alt={item.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
        : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-lg">📦</div>
      }
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
        {item.description && <p className="text-xs text-gray-400 truncate">{item.description}</p>}
      </div>
      <span className="text-sm font-bold text-gray-900 flex-shrink-0">
        ${item.price.toLocaleString('es-MX')}
      </span>
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          title="Edit"
        >
          ✏️
        </button>
        <button
          onClick={remove}
          disabled={deleteItem.isPending}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
          title="Delete"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}

// ── Add item form ─────────────────────────────────────────────────────────────

function AddItemForm({
  businessId,
  scope,
  impersonateSlug,
  uploadPath,
  onDraftAdd,
  onAdded,
  open,
  onOpenChange,
}: {
  businessId: string
  scope: Scope
  impersonateSlug?: string
  uploadPath?: string
  onDraftAdd?: (product: DraftProduct) => void
  onAdded: () => void
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [form, setForm] = useState({ name: '', price: 0, description: '', images: [] as string[] })
  const adminAdd = useAddItem(businessId)
  const sellerAdd = useSellerAddItem(businessId, impersonateSlug)
  const addItem = scope === 'seller' ? sellerAdd : adminAdd
  const draftProduct = { id: `draft-${Date.now()}`, ...form }

  async function submit() {
    if (scope === 'draft') {
      if (!isDraftProductComplete(draftProduct)) return
      onDraftAdd?.(draftProduct)
      setForm({ name: '', price: 0, description: '', images: [] })
      onOpenChange(false)
      return
    }
    if (!form.name || !form.price) return
    await addItem.mutateAsync({
      name: form.name,
      price: form.price,
      description: form.description || undefined,
      images: form.images,
      image: form.images[0] ?? undefined,
      visible: true,
    })
    setForm({ name: '', price: 0, description: '', images: [] })
    onOpenChange(false)
    onAdded()
  }

  if (!open) return null

  return (
    <div className="p-3 bg-green-50 rounded-xl border border-green-200 space-y-2">
      <p className="text-xs font-semibold text-green-700">
        {scope === 'draft' ? 'Nuevo producto' : 'New product'}
      </p>
      <ProductFormFields
        form={form}
        onChange={patch => setForm(f => ({ ...f, ...patch }))}
        focusColor="green"
        required
        requireImage={scope === 'draft'}
        uploadPath={uploadPath}
        actionSlot={
          <>
            <Button
              type="button"
              size="sm"
              onClick={submit}
              disabled={addItem.isPending || (scope === 'draft' && !isDraftProductComplete(draftProduct))}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {addItem.isPending ? '...' : scope === 'draft' ? 'Agregar' : 'Add'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              {scope === 'draft' ? 'Cancelar' : 'Cancel'}
            </Button>
          </>
        }
      />
    </div>
  )
}

// ── Product editor ────────────────────────────────────────────────────────────

export default function ProductEditor({
  businessId,
  businessSlug,
  scope = 'admin',
  reviewSlug,
  impersonateSlug,
  readonly = false,
  draftProducts = [],
  onDraftProductsChange,
  uploadPath,
}: {
  businessId: string
  businessSlug: string
  scope?: Scope
  reviewSlug?: string
  impersonateSlug?: string
  readonly?: boolean
  draftProducts?: DraftProduct[]
  onDraftProductsChange?: (products: DraftProduct[]) => void
  uploadPath?: string
}) {
  const adminData = useItems(businessId)
  const ownerData = useSellerItems(businessId, reviewSlug ?? impersonateSlug)
  const { data, isLoading, refetch } = scope === 'seller' ? ownerData : adminData
  const [addOpen, setAddOpen] = useState(false)
  const STORE_URL = import.meta.env.VITE_STORE_URL ?? 'http://localhost:3010'
  const imageUploadPath = uploadPath
    ?? (businessId ? `/api/v1/stores/${encodeURIComponent(businessId)}/images` : undefined)
  const items = scope === 'draft'
    ? draftProducts.map((product, index) => ({
        ...product,
        businessId: '',
        currency: 'MXN' as const,
        visible: true,
        order: index + 1,
        createdAt: '',
        updatedAt: '',
      }))
    : data?.items ?? []
  const loading = scope === 'draft' ? false : isLoading

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-700">
          {scope === 'draft' ? 'Productos' : 'Products'} ({items.length})
        </p>
        <div className="flex items-center gap-2">
          {scope !== 'draft' && <a
            href={`${STORE_URL}/store/${businessSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-600 hover:underline hidden sm:inline"
          >
            Review store →
          </a>}
          {!readonly && (
            <Button
              type="button"
              size="sm"
              onClick={() => setAddOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              {scope === 'draft' ? 'Agregar producto' : '+ Add product'}
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <ItemRow
              key={item.id}
              item={item}
              businessId={businessId}
              scope={scope}
              readonly={readonly}
              impersonateSlug={impersonateSlug}
              draft={scope === 'draft'}
              uploadPath={imageUploadPath}
              onDraftChange={product => onDraftProductsChange?.(
                draftProducts.map(current => current.id === product.id ? product : current)
              )}
              onDraftRemove={productId => onDraftProductsChange?.(
                draftProducts.filter(product => product.id !== productId)
              )}
              onSaved={() => refetch()}
            />
          ))}
          {!readonly && (
            <AddItemForm
              businessId={businessId}
              scope={scope}
              impersonateSlug={impersonateSlug}
              uploadPath={imageUploadPath}
              onDraftAdd={product => onDraftProductsChange?.([...draftProducts, product])}
              onAdded={() => refetch()}
              open={addOpen}
              onOpenChange={setAddOpen}
            />
          )}
        </div>
      )}
    </div>
  )
}
