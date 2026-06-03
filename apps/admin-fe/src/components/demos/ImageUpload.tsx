import { useState, useRef } from 'react'
import { api } from '@/lib/api'
import { compressImage } from '@/lib/compressImage'

interface Props {
  currentUrl?: string
  onUploaded: (url: string) => void
  folder?: string
}

type UploadState = 'idle' | 'compressing' | 'uploading' | 'done'

export default function ImageUpload({ currentUrl, onUploaded, folder = 'products' }: Props) {
  const [state, setState] = useState<UploadState>('idle')
  const [preview, setPreview] = useState(currentUrl ?? '')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
    if (!ALLOWED.includes(file.type)) {
      setError('Formato no válido. Usa JPEG, PNG o WebP.')
      return
    }

    setError('')
    setState('compressing')

    // Show local preview immediately from original file
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    let compressed: File
    try {
      compressed = await compressImage(file)
    } catch {
      setError('No se pudo comprimir la imagen. Intenta con otro archivo.')
      setState('idle')
      return
    }

    setState('uploading')
    try {
      const form = new FormData()
      form.append('file', compressed)
      form.append('folder', folder)

      const data = await api.upload<{ url: string }>('/api/v1/images/upload', form)
      if (!data.url) throw new Error('No URL in upload response')
      onUploaded(data.url)
      setPreview(data.url)
      setState('done')
      setTimeout(() => setState('idle'), 3000)
    } catch {
      setError('Error al subir. Intenta de nuevo.')
      setState('idle')
    }
  }

  const busy = state === 'compressing' || state === 'uploading'

  const statusLabel = {
    compressing: '⚡ Comprimiendo...',
    uploading:   '⏳ Subiendo...',
    done:        '✅ Foto lista — guarda los cambios',
    idle:        preview ? 'Haz clic para cambiar' : '',
  }[state]

  return (
    <div className="space-y-1">
      <div
        className={`relative border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-colors ${
          state === 'done' ? 'border-green-400 bg-green-50' : 'hover:border-indigo-300'
        }`}
        onClick={() => !busy && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {preview ? (
          <div className="flex items-center gap-3">
            <img src={preview} alt="preview" className="w-14 h-14 rounded-lg object-cover border" />
            <div className="text-left flex-1">
              <p className={`text-xs font-medium ${state === 'done' ? 'text-green-700' : busy ? 'text-indigo-600 animate-pulse' : ''}`}>
                {statusLabel}
              </p>
              {!busy && state !== 'done' && (
                <p className="text-xs text-gray-400 mt-0.5">Haz clic para cambiar</p>
              )}
            </div>
          </div>
        ) : (
          <div className="py-2">
            <p className="text-sm text-gray-400">
              {busy ? statusLabel : '📷 Click to add photo'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">JPEG, PNG, WebP · se comprime automáticamente</p>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
