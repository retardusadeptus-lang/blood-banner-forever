$root = Split-Path -Parent $PSScriptRoot

Start-Process powershell -ArgumentList @('-NoProfile', '-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', "Set-Location '$root'; npm run dev") -WorkingDirectory $root
Start-Process powershell -ArgumentList @('-NoProfile', '-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', "Set-Location '$root'; node --env-file=.env guild-loot-api/server.js") -WorkingDirectory $root
