import { useState, useRef } from 'react'
import { api } from '@/lib/api'

interface Props {
  currentUrl?: string
  onUploaded: (url: string) => void
  folder?: string
}

export default function ImageUpload({ currentUrl, onUploaded, folder = 'products' }: Props) {
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
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
    setUploaded(false)

    // Show local preview immediately
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    try {
      const form = new FormData()
      form.append('file', file)
      form.append('folder', folder)

      const data = await api.upload<{ url: string }>('/api/v1/images/upload', form)
      if (!data.url) throw new Error('No URL in upload response')
      onUploaded(data.url)
      setPreview(data.url)
      setUploaded(true)
      setTimeout(() => setUploaded(false), 3000)
    } catch {
      setError('Upload failed. Try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-1">
      <div
        className={`relative border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-colors ${
          uploaded ? 'border-green-400 bg-green-50' : 'hover:border-indigo-300'
        }`}
        onClick={() => !uploading && inputRef.current?.click()}
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
              {uploaded ? (
                <p className="text-xs font-semibold text-green-700">✅ Photo uploaded — click Save</p>
              ) : uploading ? (
                <p className="text-xs text-indigo-600 animate-pulse">⏳ Uploading...</p>
              ) : (
                <p className="text-xs font-medium">Photo ready</p>
              )}
              <p className="text-xs text-gray-400 mt-0.5">Click to change</p>
            </div>
          </div>
        ) : (
          <div className="py-2">
            <p className="text-sm text-gray-400">
              {uploading ? '⏳ Uploading...' : '📷 Click to add photo'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">JPEG, PNG, WebP · max 2MB</p>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
