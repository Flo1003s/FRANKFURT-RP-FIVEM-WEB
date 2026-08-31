// app.js - Frontend logic for Frankfurt RP
// WICHTIG: Wenn dein Backend eine andere URL hat (nicht pages.dev), ändere BACKEND_URL entsprechend.
const BACKEND_URL = 'https://frankfurt-rp-fivem.pages.dev' // <-- Ersetze wenn nötig

const socket = io(BACKEND_URL, { transports: ['websocket'] })
let token = null
let localStream = null
let pc = null
let currentRoom = null
const servers = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
const el = id => document.getElementById(id)
const show = id => el(id)?.classList.remove('hidden')
const hide = id => el(id)?.classList.add('hidden')
const api = (path, opts = {}) => {
  opts.headers = opts.headers || {}
  opts.headers['Content-Type'] = 'application/json'
  if (token) opts.headers['Authorization'] = 'Bearer ' + token
  return fetch(BACKEND_URL + path, opts).then(r => r.json())
}

/* UI bindings */
if (el('loginBtn')) el('loginBtn').addEventListener('click', async () => {
  const u = el('login-username').value.trim()
  const p = el('login-password').value
  if (!u || !p) return alert('Bitte Benutzerdaten ausfüllen')
  const res = await api('/api/login', { method: 'POST', body: JSON.stringify({ username: u, password: p }) })
  if (res.token) { token = res.token; localStorage.setItem('frankfurt_token', token); onLoggedIn() } else alert('Login fehlgeschlagen')
})

if (el('regBtn')) el('regBtn').addEventListener('click', async () => {
  const identifier = el('reg-identifier').value.trim()
  const username = el('reg-username').value.trim()
  const password = el('reg-password').value
  if (!identifier || !username || !password) return alert('Bitte alle Felder ausfüllen')
  try {
    const res = await fetch(BACKEND_URL + '/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, username, password })
    })
    const j = await res.json()
    if (j.ok) alert('Registrierung erfolgreich. Im Spiel ggf. reconnecten.'); else alert('Fehler: ' + (j.error || JSON.stringify(j)))
  } catch (e) { alert('Netzwerkfehler') }
})

if (el('createTicketBtn')) el('createTicketBtn').addEventListener('click', async () => {
  const title = el('ticket-title').value.trim()
  const description = el('ticket-desc').value.trim()
  if (!title) return alert('Titel ist erforderlich')
  const res = await api('/api/tickets/create', { method: 'POST', body: JSON.stringify({ title, description, user_id: null }) })
  if (res.ok) { alert('Ticket erstellt'); refreshMyTickets() } else alert('Fehler beim Erstellen: ' + (res.error || JSON.stringify(res)))
})

if (el('support-ready')) el('support-ready').addEventListener('change', (ev) => {
  const ready = !!ev.target.checked
  socket.emit('support-ready', { ready })
})

if (el('endCallBtn')) el('endCallBtn').addEventListener('click', () => endCall())

function onLoggedIn() {
  hide('auth-section')
  show('dashboard')
  show('support-ui')
  refreshMyTickets()
  localStorage.setItem('frankfurt_token', token)
}

async function refreshMyTickets() {
  try {
    const res = await api('/api/tickets/my')
    const list = el('myTickets')
    if (!list) return
    list.innerHTML = ''
    if (res.tickets && res.tickets.length) {
      res.tickets.forEach(t => {
        const li = document.createElement('li')
        li.textContent = `${t.title} — ${t.status || 'open'}`
        list.appendChild(li)
      })
    } else list.innerHTML = '<li>Keine Tickets</li>'
  } catch (e) { console.error(e) }
}

socket.on('connect', () => el('backend-status') && (el('backend-status').textContent = 'verbunden'))
socket.on('disconnect', () => el('backend-status') && (el('backend-status').textContent = 'getrennt'))

socket.on('assigned-room', async ({ room, role }) => {
  currentRoom = room
  await startLocalStream()
  await joinRoomAndSignal(room, role)
  show('call-area')
})

socket.on('signal', async ({ from, data }) => {
  if (!currentRoom) return
  if (!pc) await createPeerConnection(currentRoom, false)
  if (data.type === 'offer') {
    await pc.setRemoteDescription({ type: 'offer', sdp: data.sdp })
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    socket.emit('signal', { room: currentRoom, data: { type: 'answer', sdp: answer.sdp } })
  } else if (data.type === 'answer') {
    await pc.setRemoteDescription({ type: 'answer', sdp: data.sdp })
  } else if (data.type === 'ice') {
    try { await pc.addIceCandidate(data.candidate) } catch (e) { console.warn(e) }
  }
})

async function startLocalStream() {
  if (localStream) return localStream
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    if (el('localVideo')) el('localVideo').srcObject = localStream
    return localStream
  } catch (e) { alert('Mikrofonzugriff erforderlich'); throw e }
}

async function createPeerConnection(room, isCaller) {
  pc = new RTCPeerConnection(servers)
  pc.ontrack = (ev) => { if (el('remoteVideo')) el('remoteVideo').srcObject = ev.streams[0] }
  pc.onicecandidate = (ev) => { if (ev.candidate) socket.emit('signal', { room, data: { type: 'ice', candidate: ev.candidate } }) }
  if (localStream) localStream.getTracks().forEach(track => pc.addTrack(track, localStream))
  if (isCaller) {
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    socket.emit('signal', { room, data: { type: 'offer', sdp: offer.sdp } })
  }
  return pc
}

async function joinRoomAndSignal(room, role) {
  socket.emit('join-room', room)
  const isCaller = role === 'caller'
  await createPeerConnection(room, isCaller)
}

function endCall() {
  if (pc) { pc.close(); pc = null }
  if (localStream) { localStream.getTracks().forEach(t => t.stop()); localStream = null }
  if (currentRoom) { socket.emit('leave-room', currentRoom); currentRoom = null }
  hide('call-area')
}

(function init() {
  const saved = localStorage.getItem('frankfurt_token')
  if (saved) { token = saved; onLoggedIn() }
})()
