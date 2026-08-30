# FiveM auth resource

Dieses Verzeichnis enthält eine minimal funktionierende FiveM-Resource, die beim ersten Join prüft ob ein Account existiert und ansonsten eine NUI-Registrierung öffnet.

Installation
1. Kopiere den Ordner `fivem-auth` in deinen FiveM `resources/` Ordner.
2. Füge in `server.cfg` die Zeile `start fivem-auth` hinzu.
3. Setze die Convar `fivem_auth_backend_url` in deiner server start args oder in `server.cfg`:
   - `set convar fivem_auth_backend_url "https://dein-backend.tld"`
4. Starte den Server neu.

Hinweis: Die NUI HTML macht fetch zu `https://example.com/api/register` als Platzhalter — ersetze URLs in `main.js` durch deine Backend-URL.
