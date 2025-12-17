const UPLOAD_BASE_URL = import.meta.env.VITE_UPLOAD_BASE_URL || 'http://localhost:3002'

export async function uploadFile(file) {
  const form = new FormData()
  form.append('file', file)

  const res = await fetch(`${UPLOAD_BASE_URL}/upload`, {
    method: 'POST',
    body: form,
  })

  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status}`)
  }

  return res.json()
}
