export async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string,
): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    console.error('[brevo] BREVO_API_KEY manquant')
    return false
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: 'ATA Jeux Concours',
        email: process.env.BREVO_SENDER_EMAIL ?? 'noreply@jeu.achatombolafrique.com',
      },
      to: [{ email: to }],
      subject,
      htmlContent,
    }),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    console.error('[brevo] Erreur envoi email:', res.status, err)
  }

  return res.ok
}
