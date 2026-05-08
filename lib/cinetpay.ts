export type ParamsPaiement = {
  transactionId: string
  montant: number
  description: string
  userId: string
  returnUrl: string
  notifyUrl: string
}

export async function initierPaiement(
  params: ParamsPaiement,
): Promise<{ paymentUrl: string }> {
  console.log('[CinetPay] initierPaiement — SIMULATION', {
    transactionId: params.transactionId,
    montant: params.montant,
    description: params.description,
    userId: params.userId,
    returnUrl: params.returnUrl,
    notifyUrl: params.notifyUrl,
  })

  // Simule un délai réseau
  await new Promise((r) => setTimeout(r, 500))

  // TODO: remplacer par le vrai appel CinetPay
  // const { CINETPAY_API_KEY, CINETPAY_SITE_ID } = process.env
  // const res = await fetch('https://api-checkout.cinetpay.com/v2/payment', { ... })

  const paymentUrl = `https://sandbox.cinetpay.com/paiement/test/${params.transactionId}`
  console.log('[CinetPay] URL de paiement (simulation):', paymentUrl)

  return { paymentUrl }
}
