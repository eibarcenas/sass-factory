import ImageUpload from './ImageUpload'
import { useState } from 'react'
import { useItems, useAddItem, useUpdateItem, useDeleteItem, useOwnerItems, useOwnerAddItem, useOwnerUpdateItem, useOwnerDeleteItem, type Item } from '../../hooks/useItems'

type Scope = 'admin' | 'owner'

// ── Shared form fields ────────────────────────────────────────────────────────

interface FormFieldsProps {
  form: { name: string; price: number; description: string; images: string[] }
  onChange: (patch: Partial<{ name: string; price: number; description: string; images: string[] }>) => void
  focusColor: 'indigo' | 'green'
  required?: boolean
  actionSlot: React.ReactNode
}

function ProductFormFields({ form, onChange, focusColor, required, actionSlot }: FormFieldsProps) {
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
      <div className="grid grid-cols-2 gap-2">
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
        placeholder="Description (optional)"
        className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 ${ring}`}
      />
      <ImageUpload
        currentUrls={form.images}
        onChanged={urls => onChange({ images: urls })}
        folder="products"
      />
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
  onSaved: () => void
}

function ItemRow({ item, businessId, scope, readonly = false, impersonateSlug, onSaved }: RowProps) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: item.name,
    price: item.price,
    description: item.description ?? '',
    images: item.images ?? (item.image ? [item.image] : []) as string[],
  })
  const adminUpdate = useUpdateItem(businessId)
  const ownerUpdate = useOwnerUpdateItem(businessId, impersonateSlug)
  const adminDelete = useDeleteItem(businessId)
  const ownerDelete = useOwnerDeleteItem(businessId, impersonateSlug)
  const updateItem = scope === 'owner' ? ownerUpdate : adminUpdate
  const deleteItem = scope === 'owner' ? ownerDelete : adminDelete

  async function save() {
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
        actionSlot={
          <>
            <button
              onClick={save}
              disabled={updateItem.isPending}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg disabled:opacity-50"
            >
              {updateItem.isPending ? '...' : 'Save'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex-1 py-2 border border-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
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

function AddItemForm({ businessId, scope, impersonateSlug, onAdded, open, onOpenChange }: {
  businessId: string
  scope: Scope
  impersonateSlug?: string
  onAdded: () => void
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [form, setForm] = useState({ name: '', price: 0, description: '', images: [] as string[] })
  const adminAdd = useAddItem(businessId)
  const ownerAdd = useOwnerAddItem(businessId, impersonateSlug)
  const addItem = scope === 'owner' ? ownerAdd : adminAdd

  async function submit(e: React.FormEvent) {
    e.preventDefault()
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
    <form onSubmit={submit} className="p-3 bg-green-50 rounded-xl border border-green-200 space-y-2">
      <p className="text-xs font-semibold text-green-700">New product</p>
      <ProductFormFields
        form={form}
        onChange={patch => setForm(f => ({ ...f, ...patch }))}
        focusColor="green"
        required
        actionSlot={
          <>
            <button
              type="submit"
              disabled={addItem.isPending}
              className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg disabled:opacity-50"
            >
              {addItem.isPending ? '...' : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 py-2 border border-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </>
        }
      />
    </form>
  )
}

// ── Product editor ────────────────────────────────────────────────────────────

export default function ProductEditor({ businessId, businessSlug, scope = 'admin', previewSlug, impersonateSlug, readonly = false }: {
  businessId: string
  businessSlug: string
  scope?: Scope
  previewSlug?: string
  impersonateSlug?: string
  readonly?: boolean
}) {
  const adminData = useItems(businessId)
  const ownerData = useOwnerItems(businessId, previewSlug ?? impersonateSlug)
  const { data, isLoading, refetch } = scope === 'owner' ? ownerData : adminData
  const [addOpen, setAddOpen] = useState(false)
  const STOREFRONT_URL = import.meta.env.VITE_STOREFRONT_URL ?? 'http://localhost:3010'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-700">
          Products ({data?.items.length ?? 0})
        </p>
        <div className="flex items-center gap-2">
          <a
            href={`${STOREFRONT_URL}/demo/${businessSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-600 hover:underline hidden sm:inline"
          >
            Preview →
          </a>
          {!readonly && (
            <button
              onClick={() => setAddOpen(true)}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
            >
              + Add product
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {data?.items.map(item => (
            <ItemRow
              key={item.id}
              item={item}
              businessId={businessId}
              scope={scope}
              readonly={readonly}
              impersonateSlug={impersonateSlug}
              onSaved={() => refetch()}
            />
          ))}
          {!readonly && (
            <AddItemForm
              businessId={businessId}
              scope={scope}
              impersonateSlug={impersonateSlug}
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
