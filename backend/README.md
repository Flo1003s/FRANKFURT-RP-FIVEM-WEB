# Backend README

Kurzanleitung:
1) Checkout branch `supabase-setup`.
2) Kopiere `backend/.env.example` zu `backend/.env` und fülle Variablen.
3) `cd backend && npm install && npm start`
4) Backend läuft und bietet /api endpoints sowie Socket.io für Signalling.

Wichtig: Stelle sicher, dass DATABASE_URL auf deine Supabase/Postgres zeigt und Backend per HTTPS erreichbar ist (Let's Encrypt) für WebRTC getUserMedia + NUI.

Test-Account (schnell):
Nach dem Start des Backends kannst du den Test-Account per API anlegen:

curl -X POST https://<DEIN_BACKEND_URL>/api/register \
  -H "Content-Type: application/json" \
  -d '{"identifier":"license:TEST","username":"tester","password":"TESTACC123!"}'
