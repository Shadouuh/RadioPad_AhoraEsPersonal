import cors from 'cors'
import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

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
app.use(express.json())

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

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const adminClient = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : null

function bearer(req) {
  const h = String(req.headers.authorization || '')
  const m = h.match(/^Bearer\\s+(.+)$/i)
  return m ? m[1] : null
}

async function requireChief(req, res, next) {
  if (!adminClient) {
    res.status(500).json({ error: 'Supabase admin not configured' })
    return
  }
  const token = bearer(req)
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  const userRes = await adminClient.auth.getUser(token)
  const u = userRes?.data?.user
  if (!u) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  let role = null
  const profRes = await adminClient
    .from('profiles')
    .select('role')
    .eq('user_id', u.id)
    .limit(1)
  const pr = Array.isArray(profRes.data) && profRes.data.length ? profRes.data[0] : null
  role = pr?.role || u?.user_metadata?.role || null
  if (String(role || '').toLowerCase() !== 'chief') {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  req.adminUser = u
  next()
}

async function nextLegacyId() {
  const res = await adminClient
    .from('profiles')
    .select('legacy_id')
    .order('legacy_id', { ascending: false })
    .limit(1)
  const max = Array.isArray(res.data) && res.data.length && res.data[0]?.legacy_id != null ? Number(res.data[0].legacy_id) : 0
  return Number.isFinite(max) ? max + 1 : 1
}

function toAppUser(u, p) {
  const meta = u?.user_metadata || {}
  const id = p?.legacy_id != null ? p.legacy_id : meta.legacyId != null ? meta.legacyId : 0
  const assigned =
    Array.isArray(p?.assigned_program_ids) && p.assigned_program_ids.length > 0
      ? p.assigned_program_ids
      : Array.isArray(meta.assignedProgramIds)
      ? meta.assignedProgramIds
      : []
  return {
    id,
    username: meta.username || u?.email || '',
    fullName: p?.full_name || meta.fullName || '',
    role: p?.role || meta.role || 'operator',
    assignedProgramIds: assigned,
  }
}

app.get('/admin/users', requireChief, async (req, res) => {
  const list = await adminClient.auth.admin.listUsers({ perPage: 200 })
  const users = list?.data?.users || []
  const profRes = await adminClient
    .from('profiles')
    .select('user_id, full_name, role, assigned_program_ids, legacy_id')
  const profs = Array.isArray(profRes.data) ? profRes.data : []
  const byId = new Map()
  profs.forEach((p) => byId.set(p.user_id, p))
  const out = users.map((u) => toAppUser(u, byId.get(u.id)))
  res.json(out)
})

app.post('/admin/users', requireChief, async (req, res) => {
  const { username, password, fullName, role, assignedProgramIds } = req.body || {}
  const email = String(username || '').trim()
  const pass = String(password || '').trim()
  const r = String(role || '').trim().toLowerCase()
  if (!email || !pass || !fullName) {
    res.status(400).json({ error: 'Missing fields' })
    return
  }
  const legacyId = await nextLegacyId()
  const meta = {
    username: email,
    fullName,
    role: r || 'operator',
    assignedProgramIds: Array.isArray(assignedProgramIds) ? assignedProgramIds : [],
    legacyId,
  }
  const created = await adminClient.auth.admin.createUser({
    email,
    password: pass,
    email_confirm: true,
    user_metadata: meta,
  })
  const u = created?.data?.user
  if (!u) {
    res.status(400).json({ error: 'Create failed' })
    return
  }
  await adminClient
    .from('profiles')
    .upsert(
      {
        user_id: u.id,
        full_name: fullName,
        role: meta.role,
        assigned_program_ids: meta.assignedProgramIds,
        legacy_id: legacyId,
      },
      { onConflict: 'user_id' },
    )
  const profRes = await adminClient
    .from('profiles')
    .select('user_id, full_name, role, assigned_program_ids, legacy_id')
    .eq('user_id', u.id)
    .limit(1)
  const p = Array.isArray(profRes.data) && profRes.data.length ? profRes.data[0] : null
  res.json(toAppUser(u, p))
})

app.patch('/admin/users/:legacyId', requireChief, async (req, res) => {
  const legacyId = Number(req.params.legacyId)
  const { role, assignedProgramIds } = req.body || {}
  const profRes = await adminClient
    .from('profiles')
    .select('user_id')
    .eq('legacy_id', legacyId)
    .limit(1)
  const p = Array.isArray(profRes.data) && profRes.data.length ? profRes.data[0] : null
  if (!p?.user_id) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  if (role != null || assignedProgramIds != null) {
    await adminClient
      .from('profiles')
      .update({
        role: role != null ? String(role).toLowerCase() : undefined,
        assigned_program_ids: Array.isArray(assignedProgramIds) ? assignedProgramIds : undefined,
      })
      .eq('legacy_id', legacyId)
    await adminClient.auth.admin.updateUserById(p.user_id, {
      user_metadata: {
        role: role != null ? String(role).toLowerCase() : undefined,
        assignedProgramIds: Array.isArray(assignedProgramIds) ? assignedProgramIds : undefined,
      },
    })
  }
  res.json({ ok: true })
})

app.delete('/admin/users/:legacyId', requireChief, async (req, res) => {
  const legacyId = Number(req.params.legacyId)
  const profRes = await adminClient
    .from('profiles')
    .select('user_id')
    .eq('legacy_id', legacyId)
    .limit(1)
  const p = Array.isArray(profRes.data) && profRes.data.length ? profRes.data[0] : null
  if (!p?.user_id) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  await adminClient.auth.admin.deleteUser(p.user_id)
  await adminClient.from('profiles').delete().eq('legacy_id', legacyId)
  res.json({ ok: true })
})

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
