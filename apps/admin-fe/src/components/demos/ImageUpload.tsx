import { useState, useRef, useEffect } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'

interface Props {
  currentUrl?: string
  onUploaded: (url: string) => void
  folder?: string
}

type UploadState = 'idle' | 'uploading' | 'done'

// ── Crop dialog ───────────────────────────────────────────────────────────────

const EXPORT_SIZE = 600 // canvas resolution for the cropped output

function CropDialog({
  file,
  onConfirm,
  onCancel,
}: {
  file: File
  onConfirm: (cropped: File) => void
  onCancel: () => void
}) {
  const [srcUrl, setSrcUrl]         = useState('')
  const [imgSize, setImgSize]       = useState({ w: 0, h: 0 })
  const [offset, setOffset]         = useState({ x: 0, y: 0 })
  const [dragOrigin, setDragOrigin] = useState<{ px: number; py: number; ox: number; oy: number } | null>(null)
  const imgRef       = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setSrcUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  function containerSize() {
    return containerRef.current?.offsetWidth ?? 280
  }

  function clamp(x: number, y: number, w: number, h: number) {
    const cs = containerSize()
    return {
      x: Math.min(0, Math.max(cs - w, x)),
      y: Math.min(0, Math.max(cs - h, y)),
    }
  }

  function handleLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth: nw, naturalHeight: nh } = e.currentTarget
    const cs    = containerSize()
    const ratio = nw / nh
    const w     = ratio >= 1 ? Math.round(cs * ratio) : cs
    const h     = ratio >= 1 ? cs : Math.round(cs / ratio)
    setImgSize({ w, h })
    setOffset(clamp(-(w - cs) / 2, -(h - cs) / 2, w, h))
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
    if (!img || !srcUrl || imgSize.w === 0) return
    const cs     = containerSize()
    const canvas = document.createElement('canvas')
    canvas.width  = EXPORT_SIZE
    canvas.height = EXPORT_SIZE
    const ctx    = canvas.getContext('2d')!
    const scaleX = img.naturalWidth  / imgSize.w
    const scaleY = img.naturalHeight / imgSize.h
    ctx.drawImage(
      img,
      (-offset.x) * scaleX, (-offset.y) * scaleY,
      cs * scaleX, cs * scaleY,
      0, 0, EXPORT_SIZE, EXPORT_SIZE,
    )
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
          {srcUrl && (
            <img
              ref={imgRef}
              src={srcUrl}
              alt=""
              onLoad={handleLoad}
              draggable={false}
              className="absolute pointer-events-none"
              style={{
                width: imgSize.w || '100%',
                height: imgSize.h || 'auto',
                transform: `translate(${offset.x}px, ${offset.y}px)`,
              }}
            />
          )}
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

// ── Image upload ──────────────────────────────────────────────────────────────

export default function ImageUpload({ currentUrl, onUploaded, folder = 'products' }: Props) {
  const [state, setState]       = useState<UploadState>('idle')
  const [preview, setPreview]   = useState(currentUrl ?? '')
  const [error, setError]       = useState('')
  const [cropFile, setCropFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function upload(file: File) {
    setError('')
    setState('uploading')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('folder', folder)
      const data = await api.upload<{ url: string }>('/api/v1/images/upload', form)
      if (!data.url) throw new Error('No URL')
      onUploaded(data.url)
      setPreview(data.url)
      setState('done')
      setTimeout(() => setState('idle'), 3000)
    } catch {
      setError('Error al subir. Intenta de nuevo.')
      setState('idle')
    }
  }

  function handleFile(file: File) {
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
    if (!ALLOWED.includes(file.type)) {
      setError('Formato no válido. Usa JPEG, PNG o WebP.')
      return
    }
    setError('')
    setCropFile(file)
  }

  function handleCropConfirm(cropped: File) {
    setPreview(URL.createObjectURL(cropped))
    setCropFile(null)
    upload(cropped)
  }

  const busy = state === 'uploading'

  return (
    <>
      {cropFile && (
        <CropDialog
          file={cropFile}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropFile(null)}
        />
      )}

      <div className="space-y-1">
        <div
          className={`relative border-2 border-dashed rounded-xl p-3 text-center transition-colors ${
            busy ? 'opacity-70' : 'cursor-pointer'
          } ${state === 'done' ? 'border-green-400 bg-green-50' : 'hover:border-indigo-300'}`}
          onClick={() => !busy && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={e => { if (e.target.files?.[0]) { handleFile(e.target.files[0]); e.target.value = '' } }}
          />

          {preview ? (
            <div className="flex items-center gap-3">
              <img src={preview} alt="preview" className="w-14 h-14 rounded-lg object-cover border shrink-0" />
              <div className="text-left flex-1 min-w-0">
                {busy ? (
                  <p className="text-xs font-medium text-indigo-600 animate-pulse">⏳ Subiendo...</p>
                ) : state === 'done' ? (
                  <p className="text-xs font-medium text-green-700">✅ Foto lista — guarda los cambios</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Haz clic para cambiar</p>
                )}
              </div>
            </div>
          ) : (
            <div className="py-2">
              <p className="text-sm text-muted-foreground">
                {busy ? '⏳ Subiendo...' : '📷 Añadir foto'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">JPEG, PNG, WebP</p>
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </>
  )
}
