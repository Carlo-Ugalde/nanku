# Connects the reservation alerts to Telegram. Run it in YOUR OWN terminal:
#   powershell -ExecutionPolicy Bypass -File scripts\telegram-setup.ps1
#
# 1. Talk to @BotFather in Telegram -> /newbot -> copy the token it gives you.
# 2. Run this script and paste the token when asked (typed hidden, only ever sent to api.telegram.org).
# 3. It finds your chat id, sends a test message, and prints a fresh CRON_SECRET.
# 4. Put TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, CRON_SECRET and AUTO_ACCEPT_ENABLED=true
#    in Vercel > nanku project > Settings > Environment Variables, then redeploy.
#
# The token is never written to disk or printed. A chat id is not a secret.

$ErrorActionPreference = 'Stop'

$sec   = Read-Host 'Token del bot (no se muestra)' -AsSecureString
$token = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))
if (-not $token) { Write-Host 'Token vacio.' -ForegroundColor Red; exit 1 }
$api = "https://api.telegram.org/bot$token"

function Call($method, $body) {
    # Swallow the exception text: PowerShell puts the full URL (with the token) in it.
    try {
        if ($body) { return Invoke-RestMethod -Method Post -Uri "$api/$method" -ContentType 'application/json' -Body ($body | ConvertTo-Json -Depth 5) }
        return Invoke-RestMethod -Uri "$api/$method"
    } catch {
        Write-Host "Telegram rechazo '$method' (token incorrecto, o el bot tiene un webhook activo)." -ForegroundColor Red
        exit 1
    }
}

$me = (Call 'getMe' $null).result
Write-Host "Bot: @$($me.username)" -ForegroundColor Green

Write-Host "`nAbre Telegram, busca @$($me.username), pulsa Start y escribele cualquier mensaje."
Read-Host 'Cuando lo hayas enviado, pulsa Enter' | Out-Null

$updates = (Call 'getUpdates' $null).result
$chat = $updates | Where-Object { $_.message.chat.type -eq 'private' } | Select-Object -Last 1
if (-not $chat) { Write-Host 'No llego ningun mensaje privado al bot. Escribele de nuevo y reintenta.' -ForegroundColor Red; exit 1 }

$chatId = $chat.message.chat.id
Write-Host "`nTELEGRAM_CHAT_ID = $chatId" -ForegroundColor Green

Call 'sendMessage' @{ chat_id = $chatId; text = 'Nanku: alertas de reservas conectadas.' } | Out-Null
Write-Host 'Mensaje de prueba enviado.'

$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$cron = -join ($bytes | ForEach-Object { $_.ToString('x2') })
Write-Host "`nCRON_SECRET (nuevo, pegalo en Vercel y guardalo tu; solo se muestra ahora):"
Write-Host $cron -ForegroundColor Yellow
