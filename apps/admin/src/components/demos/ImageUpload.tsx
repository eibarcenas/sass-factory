import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

interface Props {
  currentUrl?: string
  onUploaded: (url: string) => void
  folder?: string
}

export default function ImageUpload({ currentUrl, onUploaded, folder = 'products' }: Props) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(currentUrl ?? '')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
    if (!ALLOWED.includes(file.type)) {
      setError(`Invalid type. Use JPEG, PNG, WebP.`)
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 2MB.`)
      return
    }
    setError('')
    setUploading(true)

    // Show local preview immediately
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    try {
      const form = new FormData()
      form.append('file', file)
      form.append('folder', folder)

      const res = await fetch(`${API_URL}/api/v1/images/upload`, {
        method: 'POST',
        body: form,
      })
      const data = await res.json()
      if (data.url) {
        onUploaded(data.url)
        setPreview(data.url)
      }
    } catch {
      setError('Upload failed. Try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div
        className="relative border-2 border-dashed rounded-xl p-3 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => inputRef.current?.click()}
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
            <div className="text-left">
              <p className="text-xs font-medium">Photo uploaded</p>
              <p className="text-xs text-muted-foreground">Click to change</p>
            </div>
          </div>
        ) : (
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              {uploading ? 'Uploading...' : '📷 Click to add photo'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">JPEG, PNG, WebP · max 2MB</p>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
