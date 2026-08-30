-- client.lua
RegisterNetEvent('fivemauth:showRegister')
AddEventHandler('fivemauth:showRegister', function(identifier)
  SetNuiFocus(true, true)
  SendNUIMessage({ action = 'openRegister', identifier = identifier })
end)

RegisterNUICallback('submitRegister', function(data, cb)
  TriggerServerEvent('fivemauth:submitRegister', data)
  cb({ ok = true })
end)

RegisterNetEvent('fivemauth:registerResult')
AddEventHandler('fivemauth:registerResult', function(res)
  if res.ok then
    SetNuiFocus(false, false)
    notify('Registrierung erfolgreich. Bitte reconnect.')
  else
    notify('Registrierung fehlgeschlagen. Fehler: '..tostring(res.code))
  end
end)

function notify(text)
  SetNotificationTextEntry('STRING')
  AddTextComponentString(text)
  DrawNotification(false, true)
end
