import { useState } from 'react'
import { useItems, useAddItem, useUpdateItem, useDeleteItem, type Item } from '../../hooks/useItems'

interface RowProps {
  item: Item
  businessId: string
  onSaved: () => void
}

function ItemRow({ item, businessId, onSaved }: RowProps) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: item.name, price: item.price, description: item.description ?? '' })
  const updateItem = useUpdateItem(businessId)
  const deleteItem = useDeleteItem(businessId)

  async function save() {
    await updateItem.mutateAsync({ itemId: item.id, patch: { ...form, price: Number(form.price) } })
    setEditing(false)
    onSaved()
  }

  async function remove() {
    if (!confirm(`Delete "${item.name}"?`)) return
    await deleteItem.mutateAsync(item.id)
  }

  if (editing) {
    return (
      <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 space-y-2">
        <input
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Product name"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
            <span className="px-2 py-2 bg-gray-50 text-gray-400 text-sm border-r">$</span>
            <input
              type="number"
              value={form.price}
              onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
              className="flex-1 px-2 py-2 text-sm focus:outline-none"
              min={0}
            />
            <span className="px-2 py-2 bg-gray-50 text-gray-400 text-xs border-l">MXN</span>
          </div>
          <div className="flex gap-2">
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
          </div>
        </div>
        <input
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Description (optional)"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${item.visible ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
        {item.description && (
          <p className="text-xs text-gray-400 truncate">{item.description}</p>
        )}
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

function AddItemForm({ businessId, onAdded }: { businessId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', price: '', description: '' })
  const addItem = useAddItem(businessId)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.price) return
    await addItem.mutateAsync({ name: form.name, price: Number(form.price), description: form.description || undefined, visible: true })
    setForm({ name: '', price: '', description: '' })
    setOpen(false)
    onAdded()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-2 border-2 border-dashed border-gray-200 text-gray-400 text-sm rounded-xl hover:border-indigo-300 hover:text-indigo-500 transition-colors"
      >
        + Add product
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="p-3 bg-green-50 rounded-xl border border-green-200 space-y-2">
      <p className="text-xs font-semibold text-green-700">New product</p>
      <input
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        placeholder="Product name *"
        required
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      />
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-green-500">
          <span className="px-2 py-2 bg-gray-50 text-gray-400 text-sm border-r">$</span>
          <input
            type="number"
            value={form.price}
            onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
            placeholder="0"
            min={0}
            required
            className="flex-1 px-2 py-2 text-sm focus:outline-none"
          />
          <span className="px-2 py-2 bg-gray-50 text-gray-400 text-xs border-l">MXN</span>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={addItem.isPending}
            className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg disabled:opacity-50"
          >
            {addItem.isPending ? '...' : 'Add'}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex-1 py-2 border border-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
      <input
        value={form.description}
        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        placeholder="Description (optional)"
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </form>
  )
}

export default function ProductEditor({ businessId, businessSlug }: { businessId: string; businessSlug: string }) {
  const { data, isLoading, refetch } = useItems(businessId)
  const STOREFRONT_URL = import.meta.env.VITE_STOREFRONT_URL ?? 'http://localhost:3010'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700">
          Products ({data?.items.length ?? 0})
        </p>
        <a
          href={`${STOREFRONT_URL}/demo/${businessSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-indigo-600 hover:underline"
        >
          Preview storefront →
        </a>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {data?.items.map(item => (
            <ItemRow key={item.id} item={item} businessId={businessId} onSaved={() => refetch()} />
          ))}
          <AddItemForm businessId={businessId} onAdded={() => refetch()} />
        </div>
      )}
    </div>
  )
}
