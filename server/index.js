import express from 'express'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.resolve(__dirname, '../data')
const DATA_FILE = path.resolve(DATA_DIR, 'forms.json')

class JsonFormsStore {
  async ensureStorage() {
    await fs.mkdir(DATA_DIR, { recursive: true })

    try {
      await fs.access(DATA_FILE)
    } catch {
      await fs.writeFile(DATA_FILE, '[]', 'utf-8')
    }
  }

  async list() {
    await this.ensureStorage()
    const raw = await fs.readFile(DATA_FILE, 'utf-8')
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed
  }

  async upsert(entry) {
    const forms = await this.list()
    const next = forms.filter((item) => item.id !== entry.id)
    const saved = {
      id: entry.id,
      data: entry.data,
      updatedAt: new Date().toISOString(),
    }

    next.unshift(saved)
    await fs.writeFile(DATA_FILE, JSON.stringify(next, null, 2), 'utf-8')
    return saved
  }
}

const store = new JsonFormsStore()
const app = express()
const port = process.env.PORT || 4000

app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/forms', async (_req, res) => {
  try {
    const forms = await store.list()
    res.json(forms)
  } catch {
    res.status(500).json({ message: 'No fue posible listar formularios.' })
  }
})

app.post('/api/forms', async (req, res) => {
  const { id, data } = req.body ?? {}

  if (!id || typeof id !== 'string' || !data || typeof data !== 'object') {
    res.status(400).json({ message: 'Payload inválido.' })
    return
  }

  try {
    const saved = await store.upsert({ id, data })
    res.status(201).json(saved)
  } catch {
    res.status(500).json({ message: 'No fue posible guardar el formulario.' })
  }
})

app.listen(port, () => {
  console.log(`Forms API escuchando en http://localhost:${port}`)
})
