// Telegram alerts for the restaurant owner. Never throws: a failed alert must not
// break a reservation. Needs TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in the environment.

export const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export async function sendTelegram(html: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) {
    console.warn('[telegram] TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set — alert skipped')
    return false
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: html,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })
    if (!res.ok) {
      // Telegram error bodies describe the problem and never echo the token.
      console.error('[telegram] sendMessage failed:', res.status, await res.text())
      return false
    }
    return true
  } catch (e) {
    console.error('[telegram] sendMessage error:', e instanceof Error ? e.message : e)
    return false
  }
}
