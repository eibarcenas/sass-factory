import { useState, useRef } from 'react'
import { Plus, X } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'

interface Props {
  currentUrls?: string[]
  onChanged: (urls: string[]) => void
  folder?: string
  max?: number
  uploadPath?: string
  disabled?: boolean
}

const EXPORT_SIZE = 600

// ── Crop dialog ───────────────────────────────────────────────────────────────

function CropDialog({
  file,
  onConfirm,
  onCancel,
}: {
  file: File
  onConfirm: (cropped: File) => void
  onCancel: () => void
}) {
  const [srcUrl, setSrcUrl]         = useState(() => URL.createObjectURL(file))
  const [imgSize, setImgSize]       = useState({ w: 0, h: 0 })
  const [offset, setOffset]         = useState({ x: 0, y: 0 })
  const [dragOrigin, setDragOrigin] = useState<{ px: number; py: number; ox: number; oy: number } | null>(null)
  const imgRef       = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  function cs() { return containerRef.current?.offsetWidth ?? 280 }

  function clamp(x: number, y: number, w: number, h: number) {
    const size = cs()
    return { x: Math.min(0, Math.max(size - w, x)), y: Math.min(0, Math.max(size - h, y)) }
  }

  function handleLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth: nw, naturalHeight: nh } = e.currentTarget
    const size  = cs()
    const ratio = nw / nh
    const w     = ratio >= 1 ? Math.round(size * ratio) : size
    const h     = ratio >= 1 ? size : Math.round(size / ratio)
    setImgSize({ w, h })
    setOffset(clamp(-(w - size) / 2, -(h - size) / 2, w, h))
  }

  function startDrag(px: number, py: number) {
    setDragOrigin({ px, py, ox: offset.x, oy: offset.y })
  }

  function moveDrag(px: number, py: number) {
    if (!dragOrigin) return
    setOffset(clamp(
      dragOrigin.ox + (px - dragOrigin.px),
      dragOrigin.oy + (py - dragOrigin.py),
      imgSize.w, imgSize.h,
    ))
  }

  function confirm() {
    const img = imgRef.current
    if (!img || imgSize.w === 0) return
    const size   = cs()
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = EXPORT_SIZE
    const ctx    = canvas.getContext('2d')!
    const scaleX = img.naturalWidth  / imgSize.w
    const scaleY = img.naturalHeight / imgSize.h
    ctx.drawImage(img, (-offset.x) * scaleX, (-offset.y) * scaleY, size * scaleX, size * scaleY, 0, 0, EXPORT_SIZE, EXPORT_SIZE)
    URL.revokeObjectURL(srcUrl)
    canvas.toBlob(blob => {
      if (!blob) return
      onConfirm(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.85)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl p-4 w-full max-w-xs space-y-4">
        <p className="font-semibold text-sm text-center">Encuadra tu imagen</p>

        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-xl w-full aspect-square bg-muted select-none"
          style={{ cursor: dragOrigin ? 'grabbing' : 'grab', touchAction: 'none' }}
          onMouseDown={e => startDrag(e.clientX, e.clientY)}
          onMouseMove={e => moveDrag(e.clientX, e.clientY)}
          onMouseUp={() => setDragOrigin(null)}
          onMouseLeave={() => setDragOrigin(null)}
          onTouchStart={e => { e.preventDefault(); const t = e.touches[0]; startDrag(t.clientX, t.clientY) }}
          onTouchMove={e => { e.preventDefault(); const t = e.touches[0]; moveDrag(t.clientX, t.clientY) }}
          onTouchEnd={() => setDragOrigin(null)}
        >
          <img
            ref={imgRef}
            src={srcUrl}
            alt=""
            onLoad={handleLoad}
            draggable={false}
            className="absolute pointer-events-none"
            style={{ width: imgSize.w || '100%', height: imgSize.h || 'auto', transform: `translate(${offset.x}px, ${offset.y}px)` }}
          />
        </div>

        <p className="text-xs text-muted-foreground text-center">Arrastra para encuadrar</p>

        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="flex-1" onClick={onCancel}>Cancelar</Button>
          <Button size="sm" className="flex-1" onClick={confirm}>Usar imagen</Button>
        </div>
      </div>
    </div>
  )
}

// ── Single image slot ─────────────────────────────────────────────────────────

function ImageSlot({ url, uploading, disabled, onPick, onRemove }: {
  url: string
  uploading: boolean
  disabled: boolean
  onPick: () => void
  onRemove: () => void
}) {
  if (uploading) {
    return (
      <div className="aspect-square rounded-xl bg-muted flex items-center justify-center border border-border">
        <div className="w-5 h-5 border-2 border-muted-foreground/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (url) {
    return (
      <div className="relative aspect-square rounded-xl overflow-hidden border border-border group">
        <img src={url} alt="" className="w-full h-full object-cover" />
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors z-10"
          aria-label="Eliminar foto"
        >
          <X size={10} />
        </button>
        <button
          type="button"
          onClick={onPick}
          disabled={disabled}
          className="absolute inset-0 bg-black/0 group-hover:bg-black/20 group-active:bg-black/30 transition-colors"
          aria-label="Cambiar foto"
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onPick}
      disabled={disabled}
      className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/60 hover:bg-primary/5 active:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center transition-colors"
      aria-label="Añadir foto"
    >
      <Plus className="w-5 h-5 text-muted-foreground/50" />
    </button>
  )
}

// ── Multi-image upload ────────────────────────────────────────────────────────

export default function ImageUpload({
  currentUrls = [],
  onChanged,
  folder = 'products',
  max = 3,
  uploadPath = '/api/v1/images/upload',
  disabled = false,
}: Props) {
  const [urls, setUrls]             = useState<string[]>(currentUrls)
  const [uploadingSlots, setUploadingSlots] = useState<Set<number>>(new Set())
  const [cropTarget, setCropTarget] = useState<{ slotIndex: number; file: File } | null>(null)
  const [error, setError]           = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const pendingSlot = useRef<number>(-1)

  function pickForSlot(index: number) {
    if (disabled) return
    pendingSlot.current = index
    inputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
    if (!ALLOWED.includes(file.type)) {
      setError('Formato no válido. Usa JPEG, PNG o WebP.')
      return
    }
    setError('')
    setCropTarget({ slotIndex: pendingSlot.current, file })
  }

  async function handleCropConfirm(cropped: File) {
    const idx = cropTarget!.slotIndex
    setCropTarget(null)

    // Optimistic preview from local blob
    const localUrl = URL.createObjectURL(cropped)
    const nextUrls = [...urls]
    nextUrls[idx] = localUrl
    setUrls(nextUrls)

    setUploadingSlots(prev => new Set(prev).add(idx))
    try {
      const form = new FormData()
      form.append('file', cropped)
      form.append('folder', folder)
      const data = await api.upload<{ url: string }>(uploadPath, form)
      if (!data.url) throw new Error('No URL')
      URL.revokeObjectURL(localUrl)
      const finalUrls = [...urls]
      finalUrls[idx] = data.url
      setUrls(finalUrls)
      onChanged(finalUrls.filter(Boolean))
    } catch (err: unknown) {
      const detail = err instanceof Error ? err.message : 'Error desconocido'
      setError(`Error al subir: ${detail}`)
      const rollback = [...urls]
      rollback[idx] = urls[idx] ?? ''
      URL.revokeObjectURL(localUrl)
      setUrls(rollback)
    } finally {
      setUploadingSlots(prev => { const s = new Set(prev); s.delete(idx); return s })
    }
  }

  function removeSlot(index: number) {
    const next = [...urls]
    next.splice(index, 1)
    setUrls(next)
    onChanged(next.filter(Boolean))
  }

  // Build slot array: filled urls + empty slots up to max
  const slots = Array.from({ length: max }, (_, i) => urls[i] ?? '')

  return (
    <>
      {cropTarget && (
        <CropDialog
          file={cropTarget.file}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropTarget(null)}
        />
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          {slots.map((url, i) => (
            <ImageSlot
              key={i}
              url={url}
              uploading={uploadingSlots.has(i)}
              disabled={disabled}
              onPick={() => pickForSlot(i)}
              onRemove={() => removeSlot(i)}
            />
          ))}
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </>
  )
}
