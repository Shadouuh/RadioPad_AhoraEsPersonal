import cors from 'cors'
import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = Number(process.env.UPLOAD_PORT || 3002)
const UPLOAD_DIR = path.join(__dirname, 'uploads')

fs.mkdirSync(UPLOAD_DIR, { recursive: true })

function safeExt(originalname) {
  const ext = path.extname(originalname || '').toLowerCase()
  if (!ext) return ''
  return ext.replace(/[^a-z0-9.]/g, '')
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, UPLOAD_DIR)
  },
  filename(req, file, cb) {
    const ext = safeExt(file.originalname)
    const base = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${base}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 },
})

const app = express()

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
)

app.get('/health', (req, res) => {
  res.json({ ok: true })
})

app.use('/uploads', express.static(UPLOAD_DIR))

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' })
    return
  }

  const url = `http://localhost:${PORT}/uploads/${req.file.filename}`
  res.json({
    url,
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
  })
})

app.listen(PORT, () => {
  console.log(`Upload server running on http://localhost:${PORT}`)
})
