// CallMeBot envoie des messages WhatsApp via un numéro de service.
// Chaque destinataire doit avoir activé le service une fois en envoyant
// "I allow callmebot to send me messages" au +34 644 59 79 96 sur WhatsApp.
// La clé API est ensuite fournie par le bot par retour de message.
// Pour ce projet, la clé de l'organisateur est stockée dans CALLMEBOT_API_KEY.
export async function sendWhatsApp(numero: string, message: string): Promise<boolean> {
  const apiKey = process.env.CALLMEBOT_API_KEY
  if (!apiKey) {
    console.error('[callmebot] CALLMEBOT_API_KEY manquant')
    return false
  }

  const params = new URLSearchParams({
    phone: numero,
    text: message,
    apikey: apiKey,
  })

  const res = await fetch(`https://api.callmebot.com/whatsapp.php?${params.toString()}`)

  if (!res.ok) {
    console.error('[callmebot] Erreur envoi WhatsApp:', res.status)
  }

  return res.ok
}
