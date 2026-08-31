const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const bodyParser = require('body-parser')
const cors = require('cors')
const { Pool } = require('pg')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const JWT_SECRET = process.env.JWT_SECRET || 'change_this'

app.use(cors())
app.use(bodyParser.json())

// Simple health
app.get('/api/health', (req, res) => res.json({ ok: true }))

app.post('/api/checkUser', async (req, res) => {
  const { identifier } = req.body
  if (!identifier) return res.status(400).json({ error: 'missing identifier' })
  try {
    const r = await pool.query('select id from users where fivem_identifier = $1 limit 1', [identifier])
    res.json({ exists: r.rowCount > 0 })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/register', async (req, res) => {
  const { identifier, username, password } = req.body
  if (!identifier || !username || !password) return res.status(400).json({ error: 'missing' })
  try {
    const hash = await bcrypt.hash(password, 10)
    await pool.query('insert into users (fivem_identifier, username, password_hash) values ($1,$2,$3)', [identifier, username, hash])
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'missing' })
  try {
    const r = await pool.query('select id, password_hash from users where username = $1 limit 1', [username])
    if (r.rowCount === 0) return res.status(401).json({ error: 'invalid' })
    const u = r.rows[0]
    const match = await bcrypt.compare(password, u.password_hash)
    if (!match) return res.status(401).json({ error: 'invalid' })
    const token = jwt.sign({ userId: u.id }, JWT_SECRET, { expiresIn: '2h' })
    res.json({ ok: true, token })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Ticket endpoints (minimal)
app.post('/api/tickets/create', async (req, res) => {
  const { title, description, user_id } = req.body
  if (!user_id || !title) return res.status(400).json({ error: 'missing' })
  try {
    const r = await pool.query('insert into tickets (user_id, title, description) values ($1,$2,$3) returning *', [user_id, title, description])
    res.json({ ok: true, ticket: r.rows[0] })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// WebRTC signalling via Socket.io
io.on('connection', (socket) => {
  console.log('socket connected', socket.id)
  socket.on('join-room', (room) => {
    socket.join(room)
    socket.to(room).emit('peer-joined', { id: socket.id })
  })
  socket.on('signal', ({ room, data }) => {
    socket.to(room).emit('signal', { from: socket.id, data })
  })
  socket.on('leave-room', (room) => { socket.leave(room) })
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => console.log('Server listening on', PORT))
