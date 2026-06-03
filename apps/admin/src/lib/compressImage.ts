import imageCompression from 'browser-image-compression'

const OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1024,
  useWebWorker: true,
  fileType: 'image/jpeg' as const,
  initialQuality: 0.82,
}

export async function compressImage(file: File): Promise<File> {
  const compressed = await imageCompression(file, OPTIONS)
  // Preserve a clean filename with .jpg extension
  return new File([compressed], file.name.replace(/\.[^.]+$/, '.jpg'), {
    type: 'image/jpeg',
  })
}
