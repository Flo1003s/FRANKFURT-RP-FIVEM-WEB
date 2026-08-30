-- server.lua
local json = require 'json' or function(s) return s end

local BACKEND_URL = GetConvar("fivem_auth_backend_url", "https://example.com")

RegisterNetEvent('fivemauth:submitRegister')
AddEventHandler('fivemauth:submitRegister', function(data)
  local src = source
  local payload = {
    identifier = data.identifier,
    username = data.username,
    password = data.password
  }
  PerformHttpRequest(BACKEND_URL.."/api/register", function(code, body, headers)
    if code == 200 then
      TriggerClientEvent('fivemauth:registerResult', src, { ok = true })
    else
      TriggerClientEvent('fivemauth:registerResult', src, { ok = false, code = code, body = body })
    end
  end, 'POST', json.encode(payload), { ['Content-Type'] = 'application/json' })
end)

AddEventHandler('playerConnecting', function(playerName, setKickReason, deferrals)
  local src = source
  deferrals.defer()
  local identifiers = GetPlayerIdentifiers(src)
  local identifier = nil
  for _, id in ipairs(identifiers) do
    if id:sub(1,6) == 'license' or id:sub(1,5) == 'steam' then
      identifier = id
      break
    end
  end
  if not identifier then
    deferrals.done('Kein Identifier gefunden')
    return
  end

  local body = json.encode({ identifier = identifier })
  PerformHttpRequest(BACKEND_URL.."/api/checkUser", function(code, resBody, headers)
    if code == 200 then
      local ok, res = pcall(function() return json.decode(resBody) end)
      if ok and res and res.exists == false then
        deferrals.presentCard([[
          {"type":"AdaptiveCard","version":"1.3","body":[{"type":"TextBlock","text":"Registriere dich im Spiel","weight":"Bolder"}],"actions":[{"type":"Action.Submit","title":"Öffnen"}]}]
        ])
        -- Let client open NUI after connection
        TriggerClientEvent('fivemauth:showRegister', src, identifier)
        deferrals.done()
      else
        deferrals.done()
      end
    else
      deferrals.done()
    end
  end, 'POST', body, { ['Content-Type'] = 'application/json' })
end)
