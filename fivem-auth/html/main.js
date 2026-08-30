window.addEventListener('message', (ev) => {
  const msg = ev.data
  if (msg && msg.action === 'openRegister') {
    document.getElementById('identifier').value = msg.identifier || ''
    document.getElementById('app').style.display = 'block'
  }
})

document.getElementById('regForm').addEventListener('submit', (e) => {
  e.preventDefault()
  const identifier = document.getElementById('identifier').value
  const username = document.getElementById('username').value
  const password = document.getElementById('password').value
  fetch('https://example.com/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, username, password })
  }).then(r => r.json()).then(res => {
    if (res.ok) {
      fetch('https://nui://game/ui/progress', { method: 'POST' })
      // Close NUI (FiveM uses sending message to game)
    } else {
      alert('Fehler bei Registrierung')
    }
  }).catch(err => alert('Netzwerkfehler'))
})

// Helper: send NUI callback to client.lua
function sendNuiCallback(name, data) {
  fetch(`https://${GetParentResourceName()}/${name}`, { method: 'POST', body: JSON.stringify(data) })
}
